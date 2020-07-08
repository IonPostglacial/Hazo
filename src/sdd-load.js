import StandardFields from "./standard-fields.js";

function findInDescription(description, section) {
    const re = new RegExp(`${section}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
    const match = description?.match(re) ?? null;
    return match !== null ? match[1].trim() : "";
}

function removeFromDescription(description, sections) {
    let desc = description;

    for (const section of sections) {
        const re = new RegExp(`${section}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
        desc = desc?.replace(re, "");
    }
    return desc;
}

function loadSddFile(file) {
    return new Promise(function (resolve, reject) {
        const fileReader = Object.assign(new FileReader(), {
            onload() {
                const xml = new window.sdd.Loader().load(fileReader.result);
                resolve(xml);
            },
            onerror() {
                reject(fileReader.error);
            },
        });
        fileReader.readAsText(file);
    });
}

function extractState(state) {
    return {
        id: state.id,
        descriptorId: state.characterId,
        name: state.label,
        photos: state.mediaObjects.map(m => m.source),
    };
}

function extractItem(taxon, descriptors, extraFields, statesById) {
    const [name, nameCN] = taxon.label.split(" // ");
    const item = {
        type: "taxon",
        id: taxon.id,
        hid: taxon.id,
        name: name.trim(),
        nameCN: nameCN?.trim(),
        photos: taxon.mediaObjects.map(m => m.source),
        parentId: taxon.parentId,
        topLevel: !taxon.parentId,
        children: taxon.childrenIds,
    };
    const descriptions = {};

    for (const selectedStateId of taxon.selectedStatesIds) {
        const selectedState = statesById[selectedStateId];

        if (typeof descriptions[selectedState.descriptorId] === "undefined") {
            descriptions[selectedState.descriptorId] = {
                descriptor: descriptors[selectedState.descriptorId],
                states: []
            };
        }
        descriptions[selectedState.descriptorId].states.push(selectedState);
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

function extractDescriptor(character, statesById) {
    const [name, nameCN] = character.label.split(" // ");
    return {
        type: "character",
        parentId: character.parentId,
        id: character.id,
        name, nameCN,
        detail: character.detail,
        states: character.statesIds.map(id => statesById[id]),
        photos: character.mediaObjects.map(m => m.source),
        inapplicableStates: character.inapplicableStatesIds.map(id => statesById[id]),
        topLevel: !character.parentId,
        children: character.childrenIds,
    };
}

function extractStatesById(sddContent) {
    return Object.fromEntries(sddContent.states.map(s => [s.id, extractState(s)]));
}

function extractItemsById(sddContent, descriptors, extraFields, statesById) {
    const itemsById = {};
    
    for (const taxon of sddContent.taxons) {
        itemsById[taxon.id] = extractItem(taxon, descriptors, extraFields, statesById);
    }
    return itemsById;
}

function extractDescriptorsById(sddContent, statesById) {
    const descriptorsById = {};
    
    for (const character of sddContent.characters) {
        descriptorsById[character.id] = extractDescriptor(character, statesById);
    }
    return descriptorsById;
}

async function loadSDD(file, extraFields=[]) {
    if (typeof extraFields === "undefined") { extraFields = [] }

    const datasets = await loadSddFile(file);
    const dataset = datasets[0];
    const statesById = extractStatesById(dataset);
    
    const descriptors = extractDescriptorsById(dataset, statesById);
    Object.values(descriptors).forEach(descriptor => descriptor.children = Object.fromEntries(descriptor.children.map(id => [id, descriptors[id]])));
    
    const items = extractItemsById(dataset, descriptors, extraFields, statesById);
    Object.values(items).forEach(item => item.children = Object.fromEntries(item.children.map(id => [id, items[id]])));

    console.log(descriptors);
    console.log(items);

    return { items, descriptors };
}

export default loadSDD;