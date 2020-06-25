import StandardFields from "./standard-fields.js";

const mapDOM = (e, f) => Array.prototype.map.call(e, f);
const childrenWithTag = (e, tagName) => {
    if (typeof e === "undefined" || typeof e.children === "undefined") return [];
    return Array.prototype.filter.call(e.children, child => child.tagName === tagName);
}

function getDatasetImagesById(dataset) {
    const imagesById = new Map();
    const mediaObjectsRoot = childrenWithTag(dataset, "MediaObjects")[0];
    const mediaObjects = childrenWithTag(mediaObjectsRoot, "MediaObject");

    for (const mediaObject of mediaObjects) {
        imagesById.set(mediaObject.id, childrenWithTag(mediaObject, "Source")[0]?.getAttribute("href"));
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

function getDatasetItems(dataset, descriptors, imagesById, statesById, extraFields) {
    const taxons = {};
    const childrenByHid = new Map();

    for (const codedDescription of dataset.querySelectorAll("CodedDescriptions > CodedDescription")) {
        const scope = childrenWithTag(codedDescription, "Scope")[0];
        const taxonName = childrenWithTag(scope, "TaxonName")[0];
        const representation = childrenWithTag(codedDescription, "Representation")[0];
        const categoricals = codedDescription.querySelectorAll("SummaryData > Categorical");
        const label = childrenWithTag(representation, "Label")[0];
        const detail = childrenWithTag(representation, "Detail")[0];
        const taxonId = taxonName.getAttribute("ref");
        const codedMediaObjects = representation.getElementsByTagName("MediaObject");
        const mediaObjects = codedMediaObjects.length > 0 ?
            codedMediaObjects :
            dataset.querySelectorAll(`TaxonNames > TaxonName[id="${taxonId}"] > Representation > MediaObject`);
        const detailText = (!detail?.textContent || detail.textContent === "undefined" || detail.textContent === "_" ) ?
            dataset.querySelector(`TaxonNames > TaxonName[id="${taxonId}"] > Representation > Detail`)?.textContent
            : detail.textContent;
        const fields = [...StandardFields, ...extraFields];
        
        const floreRe = /Flore Madagascar et Comores\s*<br>\s*fasc\s*(\d*)\s*<br>\s*page\s*(\d*)/i;
        const m = detailText?.match(floreRe);
        const [, fasc, page] = typeof m !== "undefined" && m !== null ? m : [];
        let details = removeFromDescription(detailText, fields.map(field => field.label))?.replace(floreRe, "");
        const taxonNode = dataset.querySelector(`TaxonHierarchies > TaxonHierarchy > Nodes > Node > TaxonName[ref="${taxonId}"]`);
        const parentHid = childrenWithTag(taxonNode?.parentNode, "Parent")[0]?.getAttribute("ref");
        const hid = taxonNode?.parentNode.getAttribute("id");
        const [name, nameCN] = label.textContent.split(" // ");

        taxons[taxonId] = {
            type: "taxon",
            id: taxonId,
            hid,
            name: name.trim(), nameCN: nameCN?.trim(),
            fasc, page,
            detail: extractInterestingText(details ?? ""),
            photos: mapDOM(mediaObjects, m => imagesById.get(m.getAttribute("ref"))),
            descriptions: mapDOM(categoricals, categorical => ({
                descriptor: descriptors[categorical.getAttribute("ref")],
                states: mapDOM(categorical.getElementsByTagName("State"), e => statesById[e.getAttribute("ref")])
            })),
            parentId: null,
            topLevel: !parentHid,
            children: {},
        };
        for (const field of fields) {
            taxons[taxonId][field.std ? field.id : `extra-${field.id}`] = findInDescription(detailText, field.label);
        }
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
    const label = childrenWithTag(representation, "Label")[0];
    const detail = childrenWithTag(representation, "Detail")[0];
    const mediaObjects = childrenWithTag(representation, "MediaObject");

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
        const representation = childrenWithTag(character, "Representation")[0];

        descriptors[character.getAttribute("id")] = getDescriptorFromCharRepresentation(character, representation, imagesById);

        const states = character.querySelectorAll("States > StateDefinition");

        for (const state of states) {
            const representation = childrenWithTag(state, "Representation")[0];
            const label = childrenWithTag(representation, "Label")[0];
            const mediaObjects = childrenWithTag(representation, "MediaObject");

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
        const representation = childrenWithTag(character, "Representation")[0];

        descriptors[character.getAttribute("id")] = getDescriptorFromCharRepresentation(character, representation, imagesById);
    }

    const characterTrees = dataset.querySelectorAll("CharacterTrees > CharacterTree") ?? [];

    for (const characterTree of characterTrees) {
        for (const charNode of characterTree.querySelectorAll("Nodes > CharNode")) {
            const characterRef = childrenWithTag(charNode, "Character")[0]?.getAttribute("ref");
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

async function loadSDD(file, extraFields=[]) {
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
        Object.assign(items, getDatasetItems(dataset, descriptors, imagesById, statesById, extraFields));
    }
    return {
        items,
        descriptors,
    };
}

export default loadSDD;