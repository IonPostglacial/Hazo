import StandardFields from "./standard-fields.js";

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function findInDescription(description, section) {
    const re = new RegExp(`${escapeRegExp(section)}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
    const match = description?.match(re) ?? null;
    return match !== null ? match[1].trim() : "";
}

function removeFromDescription(description, sections) {
    let desc = description;

    for (const section of sections) {
        const re = new RegExp(`${escapeRegExp(section)}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
        desc = desc?.replace(re, "");
    }
    return desc;
}

function loadSddFile(file) {
    return new Promise(function (resolve, reject) {
        const fileReader = Object.assign(new FileReader(), {
            onload() {
                const xml = new window.sdd.Loader(false).load(fileReader.result);
                resolve(xml);
            },
            onerror() {
                reject(fileReader.error);
            },
        });
        fileReader.readAsText(file);
    });
}

function extractState(state, photosByRef) {
    return {
        id: state.id,
        descriptorId: state.characterId,
        name: state.label,
        photos: state.mediaObjectsRefs.map(m => photosByRef[m.ref]),
    };
}

function extractItem(taxon, descriptors, extraFields, statesById, photosByRef) {
    const [name, nameCN] = taxon.label.split(" // ");
    const item = {
        type: "taxon",
        id: taxon.id,
        hid: taxon.id,
        name: name.trim(),
        nameCN: nameCN?.trim(),
        photos: taxon.mediaObjectsRefs.map(m => photosByRef[m.ref]),
        parentId: taxon.parentId,
        topLevel: !taxon.parentId,
        children: taxon.childrenIds,
    };
    const descriptions = {};

    for (const categorical of taxon.categoricals) {
        descriptions[categorical.ref] = {
            descriptor: descriptors[categorical.ref],
            states: categorical.stateRefs.map(s => statesById[s.ref])
        };
    }
    item.descriptions = Object.values(descriptions);

    const fields = [...StandardFields, ...extraFields];
    const floreRe = /Flore Madagascar et Comores\s*<br>\s*fasc\s*(\d*)\s*<br>\s*page\s*(\d*)/i;
    const m = taxon.detail.match(floreRe);
    const [, fasc, page] = typeof m !== "undefined" && m !== null ? m : [];
    let detail = removeFromDescription(taxon.detail, fields.map(field => field.label))?.replace(floreRe, "");
 
    for (const field of fields) {
        item[field.std ? field.id : `extra-${field.id}`] = findInDescription(taxon.detail, field.label);
    }
    item.fasc = fasc;
    item.page = page;
    item.detail = detail;
    return item;
}

function extractDescriptor(character, statesById, photosByRef) {
    const [name, nameCN] = character.label.split(" // ");
    return {
        type: "character",
        parentId: character.parentId,
        id: character.id,
        name, nameCN,
        detail: character.detail,
        states: character.states.map(s => statesById[s.id]),
        photos: character.mediaObjectsRefs.map(m => photosByRef[m.ref]),
        inapplicableStates: character.inapplicableStatesRefs.map(s => statesById[s.ref]),
        topLevel: !character.parentId,
        children: character.childrenIds,
    };
}

function extractStatesById(sddContent, photosByRef) {
    return Object.fromEntries(sddContent.states.map(s => [s.id, extractState(s, photosByRef)]));
}

function extractItemsById(sddContent, descriptors, extraFields, statesById, photosByRef) {
    const itemsById = {};
    
    for (const taxon of sddContent.taxons) {
        itemsById[taxon.id] = extractItem(taxon, descriptors, extraFields, statesById, photosByRef);
    }
    return itemsById;
}

function extractDescriptorsById(sddContent, statesById, photosByRef) {
    const descriptorsById = {};
    
    for (const character of sddContent.characters) {
        descriptorsById[character.id] = extractDescriptor(character, statesById, photosByRef);
    }
    return descriptorsById;
}

function extractPhotosByRef(sddContent) {
    return Object.fromEntries(sddContent.mediaObjects.map(m => [m.id, m.source]));
}

async function loadSDD(file, extraFields=[]) {
    if (typeof extraFields === "undefined") { extraFields = [] }

    const datasets = await loadSddFile(file);
    const dataset = datasets[0];
    const photosByRef = extractPhotosByRef(dataset);
    const statesById = extractStatesById(dataset, photosByRef);
    
    const descriptors = extractDescriptorsById(dataset, statesById, photosByRef);
    Object.values(descriptors).forEach(descriptor => descriptor.children = Object.fromEntries(descriptor.children.map(id => [id, descriptors[id]])));
    
    const items = extractItemsById(dataset, descriptors, extraFields, statesById, photosByRef);
    Object.values(items).forEach(item => item.children = Object.fromEntries(item.children.map(id => [id, items[id]])));

    return { items, descriptors };
}

export default loadSDD;