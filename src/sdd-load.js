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
        name: state.name,
        photos: state.mediaObjects.map(m => m.source),
    };
}

function extractItem(taxon, descriptors, extraFields) {
    const [name, nameCN] = taxon.name.split(" // ");
    const item = {
        type: "taxon",
        id: taxon.id,
        hid: taxon.id,
        name: name.trim(),
        nameCN: nameCN?.trim(),
        photos: taxon.mediaObjects.map(m => m.source),
        parentId: taxon.parentId,
        topLevel: !taxon.parentId,
        children: Object.fromEntries(taxon.children.map(child => [child.id, extractItem(child, descriptors, extraFields)])),
    };
    const descriptions = {};

    for (const selectedState of taxon.selectedStates) {
        if (typeof descriptions[selectedState.characterId] === "undefined") {
            descriptions[selectedState.characterId] = {
                descriptor: descriptors[selectedState.characterId],
                states: []
            };
        }
        descriptions[selectedState.characterId].states.push(extractState(selectedState));
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

function extractDescriptor(character) {
    return {
        type: "character",
        parentId: character.parentId,
        id: character.id,
        name: character.name,
        detail: character.detail,
        states: character.states.map(extractState),
        photos: character.mediaObjects.map(m => m.source),
        inapplicableStates: character.inapplicableStates.map(extractState),
        topLevel: !character.parentId,
        children: Object.fromEntries(character.children.map(child => [child.id, extractDescriptor(child)])),
    };
}

function extractItemsById(sddContent, descriptors, extraFields) {
    const itemsById = {};
    
    for (const taxon of sddContent.taxons) {
        itemsById[taxon.id] = extractItem(taxon, descriptors, extraFields);
    }
    return itemsById;
}

function extractDescriptorsById(sddContent) {
    const descriptorsById = {};
    
    for (const character of sddContent.characters) {
        descriptorsById[character.id] = extractDescriptor(character);
    }
    return descriptorsById;
}

async function loadSDD(file, extraFields=[]) {
    if (typeof extraFields === "undefined") { extraFields = [] }

    const datasets = await loadSddFile(file);
    
    const descriptors = extractDescriptorsById(datasets[0]);
    const items = extractItemsById(datasets[0], descriptors, extraFields);

    return { items, descriptors };
}

export default loadSDD;