(function () { "use strict;"
    function getDatasetImagesById(dataset) {
        const imagesById = new Map();
        const mediaObjects = dataset.getElementsByTagName("MediaObjects");

        if (mediaObjects.length === 0) return imagesById;

        for (const mediaObject of mediaObjects[0].getElementsByTagName("MediaObject")) {
            if (mediaObject.getElementsByTagName("Type")[0].textContent !== "Image") { continue; }

            imagesById.set(mediaObject.id, mediaObject.getElementsByTagName("Source")[0].getAttribute("href"));
        }
        return imagesById;
    }

    function findInDescription(description, section) {
        const re = new RegExp(`${section}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
        const match = description?.match(re) ?? null;
        return match !== null ? match[1].trim() : "";
    }

    function getDatasetItems(dataset, imagesById) {
        const items = {};
        const taxonNames = dataset.getElementsByTagName("TaxonNames")[0];

        for (const taxonName of taxonNames.getElementsByTagName("TaxonName")) {
            const id = taxonName.getAttribute("id");
            const label = taxonName.getElementsByTagName("Label")[0];
            const detail = taxonName.getElementsByTagName("Detail")[0];
            const mediaObject = taxonName.getElementsByTagName("MediaObject")[0];
            const floreRe = /Flore Madagascar et Comores\s*<br>\s*fasc\s*(\d*)\s*<br>\s*page\s*(\d*)/i;
            const m = detail?.textContent?.match(floreRe);
            const [, fasc, page] = m !== null ? m : [];

            items[id] = {
                id: id,
                name: label.textContent,
                vernacularName: findInDescription(detail?.textContent, "NV"),
                meaning: findInDescription(detail?.textContent, "Sense"),
                noHerbier: findInDescription(detail?.textContent, "N° Herbier"),
                herbariumPicture: findInDescription(detail?.textContent, "Herbarium Picture"),
                fasc: fasc?.trim(),
                page: page?.trim(),
                detail: detail?.textContent,
                photo: imagesById.get(mediaObject?.getAttribute("ref"))
            };
        }   
        return items;
    }

    function getDatasetItemsHierarchy(dataset, items) {
        const itemsHierarchy = {};

        const taxonHierarchies = dataset.getElementsByTagName("TaxonHierarchies")[0];

        for (const taxonHierarchy of taxonHierarchies.getElementsByTagName("TaxonHierarchy")) {
            const nodes = taxonHierarchy.getElementsByTagName("Nodes")[0];

            for (const node of nodes.getElementsByTagName("Node")) {
                const taxonName = node.getElementsByTagName("TaxonName")[0];
                const taxonId = taxonName.getAttribute("ref");
                const parent = node.getElementsByTagName("Parent");
                const alreadyExistingEntry = itemsHierarchy[node.getAttribute("id")];

                if (typeof alreadyExistingEntry !== "undefined") {
                    // [adj.1] Adjust properties that were unknown at item creation time
                    alreadyExistingEntry.entry = items[taxonId];
                    alreadyExistingEntry.topLevel = parent.length === 0;
                }

                const hierarchyItem = alreadyExistingEntry ?? {
                    entry: items[taxonId],
                    topLevel: parent.length === 0,
                    children: {},
                    open: false
                };
                itemsHierarchy[node.getAttribute("id")] = hierarchyItem;

                if (parent.length !== 0) {
                    const parentTaxon = itemsHierarchy[parent[0].getAttribute("ref")];

                    if (typeof parentTaxon === "undefined") {
                        itemsHierarchy[parent[0].getAttribute("ref")] = {
                            entry: undefined, // We don't know yet (see [adj.1])
                            topLevel: undefined, // We don't know yet (see [adj.1])
                            children: {},
                            open: false
                        };
                    }
                    itemsHierarchy[parent[0].getAttribute("ref")].children[taxonId] = hierarchyItem;
                }
            }
        }

        return itemsHierarchy;
    }

    function getDescriptorFromCharRepresentation(character, representation, imagesById) {
        const label = representation.getElementsByTagName("Label")[0];
        const mediaObject = character.getElementsByTagName("MediaObject")[0];

        return {
            id: character.getAttribute("id"),
            name: label.textContent,
            states: [],
            inapplicableStates: [],
            photo: imagesById.get(mediaObject?.getAttribute("ref"))
        };        
    }

    function getDatasetDescriptors(dataset, imagesById) {
        const descriptors = {}, statesById = {};

        const characters = dataset.getElementsByTagName("Characters")[0];

        for (const character of characters.getElementsByTagName("CategoricalCharacter")) {
            const representation = character.getElementsByTagName("Representation")[0];

            descriptors[character.getAttribute("id")] = getDescriptorFromCharRepresentation(character, representation, imagesById);

            const states = character.getElementsByTagName("States");

            if (states.length > 0) {
                for (const state of states[0].getElementsByTagName("StateDefinition")) {
                    const representation = state.getElementsByTagName("Representation")[0];
                    const label = representation.getElementsByTagName("Label")[0];

                    statesById[state.getAttribute("id")] = {
                        id: state.getAttribute("id"),
                        descriptor: descriptors[character.getAttribute("id")],
                        name: label.textContent
                    };
                    descriptors[character.getAttribute("id")].states.push(statesById[state.getAttribute("id")]);
                }
            }
        }

        for (const character of characters.getElementsByTagName("QuantitativeCharacter")) {
            const representation = character.getElementsByTagName("Representation")[0];

            descriptors[character.getAttribute("id")] = getDescriptorFromCharRepresentation(character, representation);
        }

        return [descriptors, statesById];
    }

    function getDatasetDescriptiveConcepts(dataset) {
        const concepts = {};
        const descriptiveConcepts = dataset.getElementsByTagName("DescriptiveConcepts");

        if (descriptiveConcepts.length === 0) return concepts;

        for (const descriptiveConcept of descriptiveConcepts[0].getElementsByTagName("DescriptiveConcept")) {
            const representation = descriptiveConcept.getElementsByTagName("Representation")[0];
            const label = representation.getElementsByTagName("Label")[0];

            concepts[descriptiveConcept.getAttribute("id")] = {
                id: descriptiveConcept.getAttribute("id"),
                name: label.textContent
            };
        }
        return concepts;
    }

    function getDatasetDescriptorsHierarchy(dataset, concepts, descriptors, statesById) {
        const descriptorsHierarchy = {};

        const characterTrees = dataset.getElementsByTagName("CharacterTrees");

        for (const characterTree of characterTrees[0].getElementsByTagName("CharacterTree")) {
            const nodes = characterTree.getElementsByTagName("Nodes");
            console.log(nodes);

            for (const node of nodes[0].getElementsByTagName("Node")) {
                const descriptiveConcept = node.getElementsByTagName("DescriptiveConcept")[0];
                const entry = {
                    entry: concepts[descriptiveConcept.getAttribute("ref")],
                    topLevel: true,
                    children: {},
                    open: false
                };
                descriptorsHierarchy[node.getAttribute("id")] = entry;
            }

            for (const charNode of nodes[0].getElementsByTagName("CharNode")) {
                const parent = charNode.getElementsByTagName("Parent");
                const character = charNode.getElementsByTagName("Character")[0];

                const dependencyRules = charNode.getElementsByTagName("DependencyRules");

                if (dependencyRules.length > 0) {
                    const inapplicableIf = dependencyRules[0].getElementsByTagName("InapplicableIf")[0];

                    for (const state of inapplicableIf.getElementsByTagName("State")) {
                        descriptors[character.getAttribute("ref")].inapplicableStates.push(statesById[state.getAttribute("ref")]);
                    }
                }

                const menuItem = {
                    entry: descriptors[character.getAttribute("ref")],
                    topLevel: parent.length === 0,
                    children: {},
                    open: false
                };
                descriptorsHierarchy[character.getAttribute("ref")] = menuItem;

                if (!menuItem.topLevel) {
                    descriptorsHierarchy[parent[0].getAttribute("ref")].children[character.getAttribute("ref")] = menuItem;
                }
            }
        }
        return descriptorsHierarchy;
    }

    async function loadSDD(file) {
        const text = await file.text();
        const node = new DOMParser().parseFromString(text, "text/xml").firstElementChild;
        
        const items = {};
        const itemsHierarchy = {};
        const descriptors = {};
        const concepts = {};
        const descriptorsHierarchy = {};
        const statesById = {};
        
        for (const dataset of node.getElementsByTagName("Dataset")) {
            const imagesById = getDatasetImagesById(dataset);

            Object.assign(items, getDatasetItems(dataset, imagesById));
            Object.assign(itemsHierarchy, getDatasetItemsHierarchy(dataset, items));

            const [datasetDescriptors, datasetStatesById] = getDatasetDescriptors(dataset, imagesById);

            Object.assign(descriptors, datasetDescriptors);
            Object.assign(statesById, datasetStatesById);
            Object.assign(concepts, getDatasetDescriptiveConcepts(dataset));
            Object.assign(descriptorsHierarchy, getDatasetDescriptorsHierarchy(dataset, concepts, descriptors, statesById));

            const codedDescriptions = dataset.getElementsByTagName("CodedDescriptions")[0];

            for (const codedDescription of codedDescriptions.getElementsByTagName("CodedDescription")) {
                const scope = codedDescription.getElementsByTagName("Scope")[0];
                const taxonName = scope.getElementsByTagName("TaxonName")[0];
                const summaryData = codedDescription.getElementsByTagName("SummaryData")[0];
                const categoricals = summaryData.getElementsByTagName("Categorical");
                
                items[taxonName.getAttribute("ref")].descriptions = [];

                for (const categorical of categoricals) {
                    items[taxonName.getAttribute("ref")].descriptions.push({
                        concept: descriptors[categorical.getAttribute("ref")],
                        states: Array.from(categorical.getElementsByTagName("State")).map(e => statesById[e.getAttribute("ref")])
                    });
                }
            }
        }
        return {
            items, itemsHierarchy,
            descriptors, descriptorsHierarchy
        };
    }

    window.SDD = window.SDD ?? {};
    window.SDD.load = loadSDD;
}());