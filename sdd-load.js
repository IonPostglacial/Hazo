(function () { "use strict;"
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
        const codedDescriptions = dataset.querySelectorAll("CodedDescriptions > CodedDescription");
        const taxons = {};

        for (const codedDescription of codedDescriptions) {
            const scope = codedDescription.querySelector("Scope");
            const taxonName = scope.querySelector("TaxonName");
            const representation = codedDescription.querySelector("Representation");
            const summaryData = codedDescription.querySelector("SummaryData");
            const categoricals = summaryData.getElementsByTagName("Categorical");
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
            
            taxons[taxonId] = {
                id: taxonId,
                name: label.textContent.trim(),
                vernacularName, meaning, noHerbier, herbariumPicture, fasc, page,
                detail: extractInterestingText(details ?? ""),
                photos: Array.from(mediaObjects).map(m => imagesById.get(m.getAttribute("ref"))),
                descriptions: Array.from(categoricals).map(categorical => ({
                    descriptor: descriptors[categorical.getAttribute("ref")],
                    states: Array.from(categorical.getElementsByTagName("State")).map(e => statesById[e.getAttribute("ref")])
                }))
            };
        }
        return taxons;
    }

    function getDatasetItemsHierarchy(dataset, items) {
        const itemsHierarchy = {};

        const taxonHierarchies = dataset.querySelectorAll("TaxonHierarchies > TaxonHierarchy");

        for (const taxonHierarchy of taxonHierarchies) {
            const nodes = taxonHierarchy.querySelectorAll("Nodes > Node");

            for (const node of nodes) {
                const taxonName = node.querySelector("TaxonName");
                const taxonId = taxonName.getAttribute("ref");
                const parent = node.querySelector("Parent");
                const alreadyExistingEntry = itemsHierarchy[node.getAttribute("id")];

                if (typeof alreadyExistingEntry !== "undefined") {
                    // [adj.1] Adjust properties that were unknown at item creation time
                    alreadyExistingEntry.parentId = parent?.getAttribute("ref");
                    alreadyExistingEntry.entry = items[taxonId];
                    alreadyExistingEntry.topLevel = parent.length === 0;
                }

                const hierarchyItem = alreadyExistingEntry ?? {
                    id: node.getAttribute("id"),
                    parentId: parent?.getAttribute("ref"),
                    entry: items[taxonId],
                    topLevel: parent === null,
                    children: {},
                    open: false
                };
                itemsHierarchy[node.getAttribute("id")] = hierarchyItem;

                if (!hierarchyItem.topLevel) {
                    const parentTaxon = itemsHierarchy[parent.getAttribute("ref")];

                    if (typeof parentTaxon === "undefined") {
                        itemsHierarchy[parent.getAttribute("ref")] = {
                            id: parent.getAttribute("ref"),
                            entry: undefined, // We don't know yet (see [adj.1])
                            topLevel: undefined, // We don't know yet (see [adj.1])
                            children: {},
                            open: false
                        };
                    }
                    itemsHierarchy[parent.getAttribute("ref")].children[taxonId] = hierarchyItem;
                }
            }
        }

        return itemsHierarchy;
    }

    function getDescriptorFromCharRepresentation(character, representation, imagesById) {
        const label = representation.querySelector("Label");
        const detail = representation.querySelector("Detail");
        const mediaObjects = Array.from(character.getElementsByTagName("MediaObject"));

        return {
            id: character.getAttribute("id"),
            name: label?.textContent?.trim(),
            detail: detail?.textContent?.trim(),
            states: [],
            inapplicableStates: [],
            photos: mediaObjects.map(m => imagesById.get(m.getAttribute("ref")))
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

                statesById[state.getAttribute("id")] = {
                    id: state.getAttribute("id"),
                    descriptorId: character.getAttribute("id"),
                    name: label.textContent.trim().replace(/[\s\n]/, "")
                };
                descriptors[character.getAttribute("id")].states.push(statesById[state.getAttribute("id")]);
            }
        }

        const qCharacters = dataset.querySelectorAll("Characters > QuantitativeCharacter");

        for (const character of qCharacters) {
            const representation = character.querySelector("Representation");

            descriptors[character.getAttribute("id")] = getDescriptorFromCharRepresentation(character, representation, imagesById);
        }

        return [descriptors, statesById];
    }

    function getDatasetDescriptiveConcepts(dataset) {
        const concepts = {};
        const descriptiveConcepts = dataset.querySelectorAll("DescriptiveConcepts > DescriptiveConcept");

        for (const descriptiveConcept of descriptiveConcepts) {
            const representation = descriptiveConcept.querySelector("Representation");
            const label = representation.querySelector("Label");

            concepts[descriptiveConcept.getAttribute("id")] = {
                id: descriptiveConcept.getAttribute("id"),
                name: label.textContent.trim()
            };
        }
        return concepts;
    }

    function getDatasetDescriptorsHierarchy(dataset, concepts, descriptors, statesById) {
        const descriptorsHierarchy = {};

        const characterTrees = dataset.querySelectorAll("CharacterTrees > CharacterTree");

        for (const characterTree of characterTrees) {
            for (const node of characterTree.querySelectorAll("Nodes > Node")) {
                const descriptiveConcept = node.querySelector("DescriptiveConcept");
                const entry = {
                    id: node.getAttribute("id"),
                    entry: concepts[descriptiveConcept.getAttribute("ref")],
                    type: "concept",
                    topLevel: true,
                    children: {},
                    open: false
                };
                descriptorsHierarchy[node.getAttribute("id")] = entry;
            }
            for (const charNode of characterTree.querySelectorAll("Nodes > CharNode")) {
                const parent = charNode.querySelector("Parent");
                const character = charNode.querySelector("Character");
                const inapplicableStates = charNode.querySelectorAll("DependencyRules > InapplicableIf > State") ?? [];
                
                for (const state of inapplicableStates) {
                    descriptors[character.getAttribute("ref")].inapplicableStates.push(statesById[state.getAttribute("ref")]);
                }

                const menuItem = {
                    parentId: parent?.getAttribute("ref"),
                    entry: descriptors[character?.getAttribute("ref")],
                    type: "character",
                    topLevel: parent === null,
                    children: {},
                    open: false
                };
                descriptorsHierarchy[character.getAttribute("ref")] = menuItem;

                if (!menuItem.topLevel) {
                    descriptorsHierarchy[parent.getAttribute("ref")].children[character.getAttribute("ref")] = menuItem;
                }
            }
        }
        return descriptorsHierarchy;
    }

    function loadXmlFile(file) {
        return new Promise(function (resolve, reject) {
            const fileReader = Object.assign(new FileReader(), {
                onload() {
                    const xml = new DOMParser().parseFromString(fileReader.result,  "application/xml");
                    resolve(xml);
                },
                onerror() {
                    reject(error);
                },
            });
            fileReader.readAsText(file);
        });
    }

    async function loadSDD(file) {
        const xml = await loadXmlFile(file);
        const node = xml.firstElementChild;
        
        const items = {};
        const itemsHierarchy = {};
        const descriptors = {};
        const concepts = {};
        const descriptorsHierarchy = {};
        const statesById = {};
        
        for (const dataset of node.querySelectorAll("Dataset")) {
            const imagesById = getDatasetImagesById(dataset);            
            const [datasetDescriptors, datasetStatesById] = getDatasetDescriptors(dataset, imagesById);
            
            Object.assign(descriptors, datasetDescriptors);
            Object.assign(statesById, datasetStatesById);
            Object.assign(concepts, getDatasetDescriptiveConcepts(dataset));
            Object.assign(descriptorsHierarchy, getDatasetDescriptorsHierarchy(dataset, concepts, descriptors, statesById));
            Object.assign(items, getDatasetItems(dataset, descriptors, imagesById, statesById));
            Object.assign(itemsHierarchy, getDatasetItemsHierarchy(dataset, items));
        }
        return {
            items, itemsHierarchy,
            descriptors, descriptorsHierarchy
        };
    }

    window.SDD = window.SDD ?? {};
    window.SDD.load = loadSDD;
}());