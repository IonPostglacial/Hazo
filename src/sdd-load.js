function getDatasetImagesById(dataset) {
    const imagesById = new Map();
    const mediaObjects = dataset.querySelectorAll("MediaObjects > MediaObject");

    for (const mediaObject of mediaObjects) {
        imagesById.set(mediaObject.id, mediaObject.querySelector("Source")?.getAttribute("href"));
    }
    return imagesById;
}

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

function startOfInterestingText(txt, br) {
    let cur;
    loop: for (cur = 0; cur < txt.length; cur++) {
        switch(txt[cur]) {
            case " ":
            case "\t":
            case "\n":
                break;
            case br[0]:
                if (txt.length - cur > 3 && txt.substring(cur, cur + 4) === br) {
                    cur += 3;
                    break;
                } else {
                    break loop;
                }
            default:
                break loop;
        }
    }
    return cur;
}
  
function extractInterestingText(txt) {
    const start = startOfInterestingText(txt, "<br>");
    const end = txt.length - startOfInterestingText(txt.split("").reverse().join(""), ">rb<");

    if (start >= end) return "";

    return txt.substring(start, end);
}

function getDatasetItems(dataset, descriptors, imagesById, statesById) {
    const taxons = {};
    const childrenByHid = new Map();

    for (const codedDescription of dataset.querySelectorAll("CodedDescriptions > CodedDescription")) {
        const scope = codedDescription.querySelector("Scope");
        const taxonName = scope.querySelector("TaxonName");
        const representation = codedDescription.querySelector("Representation");
        const categoricals = codedDescription.querySelectorAll("SummaryData > Categorical");
        const label = representation.querySelector("Label");
        const detail = representation.querySelector("Detail");
        const taxonId = taxonName.getAttribute("ref");
        const codedMediaObjects = representation.getElementsByTagName("MediaObject");
        const mediaObjects = codedMediaObjects.length > 0 ?
            codedMediaObjects :
            dataset.querySelectorAll(`TaxonNames > TaxonName[id="${taxonId}"] > Representation > MediaObject`);
        const detailText = (!detail?.textContent || detail.textContent === "undefined" || detail.textContent === "_" ) ?
            dataset.querySelector(`TaxonNames > TaxonName[id="${taxonId}"] > Representation > Detail`)?.textContent
            : detail.textContent;
        const vernacularName = findInDescription(detailText, "NV");
        const meaning = findInDescription(detailText, "Sense");
        const noHerbier = findInDescription(detailText, "N° Herbier");
        const herbariumPicture = findInDescription(detailText, "Herbarium Picture");
        
        const floreRe = /Flore Madagascar et Comores\s*<br>\s*fasc\s*(\d*)\s*<br>\s*page\s*(\d*)/i;
        const m = detailText?.match(floreRe);
        const [, fasc, page] = typeof m !== "undefined" && m !== null ? m : [];
        let details = removeFromDescription(detailText, [
                "NV", "Sense", "N° Herbier", "Herbarium Picture"
            ])?.replace(floreRe, "");
        const taxonNode = dataset.querySelector(`TaxonHierarchies > TaxonHierarchy > Nodes > Node > TaxonName[ref="${taxonId}"]`);
        const parentHid = taxonNode?.parentNode.querySelector("Parent")?.getAttribute("ref");
        const hid = taxonNode?.parentNode.getAttribute("id");
        const [name, nameCN] = label.textContent.split(" // ");

        taxons[taxonId] = {
            type: "taxon",
            id: taxonId,
            hid,
            name: name.trim(), nameCN: nameCN?.trim(),
            vernacularName, meaning, noHerbier, herbariumPicture, fasc, page,
            detail: extractInterestingText(details ?? ""),
            photos: Array.from(mediaObjects).map(m => imagesById.get(m.getAttribute("ref"))),
            descriptions: Array.from(categoricals).map(categorical => ({
                descriptor: descriptors[categorical.getAttribute("ref")],
                states: Array.from(categorical.getElementsByTagName("State")).map(e => statesById[e.getAttribute("ref")])
            })),
            parentId: null,
            topLevel: !parentHid,
            children: {},
        };
        if (parentHid) {
            const children = childrenByHid.get(parentHid) ?? {};
            children[taxonId] = taxons[taxonId];
            childrenByHid.set(parentHid, children);
        }
    }
    for (const taxon of Object.values(taxons)) {
        taxon.children = childrenByHid.get(taxon.hid) ?? {};
        for (const child of Object.values(taxon.children)) {
            child.parentId = taxon.id;
        }
    }
    return taxons;
}

function getDescriptorFromCharRepresentation(character, representation, imagesById) {
    const children = Array.from(representation.children);
    const label = children.filter(c => c.tagName === "Label")[0];
    const detail = children.filter(c => c.tagName === "Detail")[0];
    const mediaObjects = children.filter(c => c.tagName === "MediaObject");

    return {
        type: "character",
        parentId: null,
        id: character.getAttribute("id"),
        name: label?.textContent?.trim(),
        detail: detail?.textContent?.trim(),
        states: [],
        photos: mediaObjects.map(m => imagesById.get(m.getAttribute("ref"))),
        inapplicableStates: [],
        topLevel: true,
        children: {},
    };        
}

function getDatasetDescriptors(dataset, imagesById) {
    const descriptors = {}, statesById = {};

    const characters = dataset.querySelectorAll("Characters > CategoricalCharacter");

    for (const character of characters) {
        const representation = character.querySelector("Representation");

        descriptors[character.getAttribute("id")] = getDescriptorFromCharRepresentation(character, representation, imagesById);

        const states = character.querySelectorAll("States > StateDefinition");

        for (const state of states) {
            const representation = state.querySelector("Representation");
            const label = representation.querySelector("Label");
            const mediaObjects = Array.from(representation.children).filter(c => c.tagName === "MediaObject");

            statesById[state.getAttribute("id")] = {
                id: state.getAttribute("id"),
                descriptorId: character.getAttribute("id"),
                name: label.textContent.trim(),
                photos: mediaObjects.map(m => imagesById.get(m.getAttribute("ref"))),
            };
            descriptors[character.getAttribute("id")].states.push(statesById[state.getAttribute("id")]);
        }
    }

    const qCharacters = dataset.querySelectorAll("Characters > QuantitativeCharacter");

    for (const character of qCharacters) {
        const representation = character.querySelector("Representation");

        descriptors[character.getAttribute("id")] = getDescriptorFromCharRepresentation(character, representation, imagesById);
    }

    const characterTrees = dataset.querySelectorAll("CharacterTrees > CharacterTree") ?? [];

    for (const characterTree of characterTrees) {
        for (const charNode of characterTree.querySelectorAll("Nodes > CharNode")) {
            const characterRef = charNode.querySelector("Character").getAttribute("ref");
            const inapplicableStates = charNode.querySelectorAll("DependencyRules > InapplicableIf > State") ?? [];
            const descriptor = descriptors[characterRef];
            
            for (const state of inapplicableStates) {
                const stateDescription = statesById[state.getAttribute("ref")];
                descriptor.inapplicableStates.push(stateDescription);
                descriptor.parentId = stateDescription.descriptorId;
            }
            descriptor.topLevel = descriptor.inapplicableStates.length === 0;
            if (!descriptor.topLevel) {
                descriptors[descriptor.parentId].children[descriptor.id] = descriptor;
            }
        }
    }
    return [descriptors, statesById];
}

function loadXmlFile(file) {
    return new Promise(function (resolve, reject) {
        const fileReader = Object.assign(new FileReader(), {
            onload() {
                const xml = new DOMParser().parseFromString(fileReader.result,  "application/xml");
                resolve(xml);
            },
            onerror() {
                reject(fileReader.error);
            },
        });
        fileReader.readAsText(file);
    });
}

async function loadSDD(file) {
    const xml = await loadXmlFile(file);
    const node = xml.firstElementChild;
    
    const items = {};
    const descriptors = {};
    const statesById = {};
    
    for (const dataset of node.querySelectorAll("Dataset")) {
        const imagesById = getDatasetImagesById(dataset);            
        const [datasetDescriptors, datasetStatesById] = getDatasetDescriptors(dataset, imagesById);
        
        Object.assign(descriptors, datasetDescriptors);
        Object.assign(statesById, datasetStatesById);
        Object.assign(items, getDatasetItems(dataset, descriptors, imagesById, statesById));
    }
    return {
        items,
        descriptors,
    };
}

export default loadSDD;