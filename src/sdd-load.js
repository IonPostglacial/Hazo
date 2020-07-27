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

function extractItem(taxon, descriptors, extraFields, statesById, photosByRef) {
    const item = window.bunga.Taxon.fromSdd(taxon, extraFields, photosByRef, descriptors, statesById);
 
    for (const [name, value] of Object.entries(item.extra)) {
        item["extra-" + name] = value;
    }
    return item;
}

function extractStatesById(sddContent, photosByRef) {
    return Object.fromEntries(sddContent.states.map(s => [s.id, window.bunga.State.fromSdd(s, photosByRef)]));
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
        descriptorsById[character.id] = window.bunga.Character.fromSdd(character, photosByRef, statesById);
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