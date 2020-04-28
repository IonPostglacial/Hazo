(function () { "use strict;"
    function getDatasetImagesById(dataset) {
        const imagesById = new Map();
        const mediaObjects = dataset.getElementsByTagName("MediaObjects")[0];

        for (const mediaObject of mediaObjects.getElementsByTagName("MediaObject")) {
            if (mediaObject.getElementsByTagName("Type")[0].textContent !== "Image") { continue; }

            imagesById.set(mediaObject.id, mediaObject.getElementsByTagName("Source")[0].getAttribute("href"));
        }
        return imagesById;
    }

    function getDatasetItems(dataset, imagesById) {
        const items = {};
        const taxonNames = dataset.getElementsByTagName("TaxonNames")[0];

        for (const taxonName of taxonNames.getElementsByTagName("TaxonName")) {
            const id = taxonName.getAttribute("id");
            const label = taxonName.getElementsByTagName("Label")[0];
            const detail = taxonName.getElementsByTagName("Detail")[0];
            const mediaObject = taxonName.getElementsByTagName("MediaObject")[0];
            
            items[id] = {
                id: id,
                name: label.textContent,
                detail: detail.textContent,
                photo: imagesById.get(mediaObject?.getAttribute("ref"))
            };
        }   
        return items;
    }

    function getDescriptorFromCharRepresentation(character, representation) {
        const label = representation.getElementsByTagName("Label")[0];

        return {
            id: character.getAttribute("id"),
            name: label.textContent,
            states: [],
            inapplicableStates: []
        };        
    }

    function getDatasetDescriptors(dataset) {
        const descriptors = {}, statesById = {};

        const characters = dataset.getElementsByTagName("Characters")[0];

        for (const character of characters.getElementsByTagName("CategoricalCharacter")) {
            const representation = character.getElementsByTagName("Representation")[0];

            descriptors[character.getAttribute("id")] = getDescriptorFromCharRepresentation(character, representation);

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

    async function loadSDD(file) {
        const text = await file.text();
        const node = new DOMParser().parseFromString(text, "text/xml").firstElementChild;
        
        const items = {};
        const itemsHierarchy = {};
        const descriptors = {};
        const descriptorsHierarchy = {};
        const statesById = {};
        
        for (const dataset of node.getElementsByTagName("Dataset")) {
            const imagesById = getDatasetImagesById(dataset);

            Object.assign(items, getDatasetItems(dataset, imagesById));

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
            const [datasetDescriptors, datasetStatesById] = getDatasetDescriptors(dataset);
            Object.assign(descriptors, datasetDescriptors);
            Object.assign(statesById, datasetStatesById);

            const concepts = {};
            const descriptiveConcepts = dataset.getElementsByTagName("DescriptiveConcepts")[0];

            for (const descriptiveConcept of descriptiveConcepts.getElementsByTagName("DescriptiveConcept")) {
                const representation = descriptiveConcept.getElementsByTagName("Representation")[0];
                const label = representation.getElementsByTagName("Label")[0];

                concepts[descriptiveConcept.getAttribute("id")] = {
                    id: descriptiveConcept.getAttribute("id"),
                    name: label.textContent
                };
            }

            const characterTrees = dataset.getElementsByTagName("CharacterTrees")[0];

            for (const characterTree of characterTrees.getElementsByTagName("CharacterTree")) {
                const nodes = characterTree.getElementsByTagName("Nodes")[0];

                for (const node of nodes.getElementsByTagName("Node")) {
                    const descriptiveConcept = node.getElementsByTagName("DescriptiveConcept")[0];
                    const entry = {
                        entry: concepts[descriptiveConcept.getAttribute("ref")],
                        topLevel: true,
                        children: {},
                        open: false
                    };
                    descriptorsHierarchy[node.getAttribute("id")] = entry;
                }

                for (const charNode of nodes.getElementsByTagName("CharNode")) {
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
                    descriptorsHierarchy[node.getAttribute("id")] = menuItem;

                    if (!menuItem.topLevel) {
                        descriptorsHierarchy[parent[0].getAttribute("ref")].children[character.getAttribute("ref")] = menuItem;
                    }
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