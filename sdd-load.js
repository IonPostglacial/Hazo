(function () { "use strict;"
    async function loadSDD(file) {
        const text = await file.text();
        const node = new DOMParser().parseFromString(text, "text/xml").firstElementChild;
        
        const items = {};
        const itemsHierarchy = {};
        const flatItemsHierarchy = {};
        const descriptors = {};
        const descriptorsHierarchy = {};
        const flatDescriptorsHierarchy = {};
        const statesById = {};
        
        for (const dataset of node.getElementsByTagName("Dataset")) {
            const imagesById = new Map();

            const mediaObjects = dataset.getElementsByTagName("MediaObjects")[0];

            for (const mediaObject of mediaObjects.getElementsByTagName("MediaObject")) {
                if (mediaObject.getElementsByTagName("Type")[0].textContent !== "Image") { continue; }

                imagesById.set(mediaObject.id, mediaObject.getElementsByTagName("Source")[0].getAttribute("href"));
            }

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

            const taxonHierarchies = dataset.getElementsByTagName("TaxonHierarchies")[0];

            for (const taxonHierarchy of taxonHierarchies.getElementsByTagName("TaxonHierarchy")) {
                const nodes = taxonHierarchy.getElementsByTagName("Nodes")[0];

                for (const node of nodes.getElementsByTagName("Node")) {
                    const taxonName = node.getElementsByTagName("TaxonName")[0];
                    const taxonId = taxonName.getAttribute("ref");
                    const parent = node.getElementsByTagName("Parent");
                    const alreadyExistingEntry = flatItemsHierarchy[node.getAttribute("id")];

                    if (typeof alreadyExistingEntry !== "undefined") {
                        alreadyExistingEntry.entry = items[taxonId];
                    }

                    const hierarchyItem = alreadyExistingEntry ?? {
                        entry: items[taxonId],
                        children: {},
                        open: false
                    };
                    flatItemsHierarchy[node.getAttribute("id")] = hierarchyItem;

                    if (parent.length === 0) {
                        itemsHierarchy[node.getAttribute("id")] = hierarchyItem;
                    } else {
                        const parentTaxon = flatItemsHierarchy[parent[0].getAttribute("ref")];

                        if (typeof parentTaxon === "undefined") {
                            flatItemsHierarchy[parent[0].getAttribute("ref")] = {
                                entry: undefined,
                                children: { [taxonId]: hierarchyItem },
                                open: false
                            };
                        }
                        flatItemsHierarchy[parent[0].getAttribute("ref")].children[taxonId] = hierarchyItem;
                    }
                }
            }

            const characters = dataset.getElementsByTagName("Characters")[0];

            for (const character of characters.getElementsByTagName("CategoricalCharacter")) {
                const representation = character.getElementsByTagName("Representation")[0];
                const label = representation.getElementsByTagName("Label")[0];

                const states = character.getElementsByTagName("States");

                descriptors[character.getAttribute("id")] = {
                    id: character.getAttribute("id"),
                    name: label.textContent,
                    states: [],
                    inapplicableStates: []
                };

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
                const label = representation.getElementsByTagName("Label")[0];

                descriptors[character.getAttribute("id")] = {
                    id: character.getAttribute("id"),
                    name: label.textContent,
                    states: [],
                    inapplicableStates: []
                };
            }

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
                        children: {},
                        open: false
                    };
                    descriptorsHierarchy[node.getAttribute("id")] = entry;
                    flatDescriptorsHierarchy[node.getAttribute("id")] = entry;
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

                    const menuItem =  {
                        entry: descriptors[character.getAttribute("ref")],
                        children: {},
                        open: false
                    };
                    flatDescriptorsHierarchy[node.getAttribute("id")] = menuItem;

                    if (parent.length > 0) {
                        flatDescriptorsHierarchy[parent[0].getAttribute("ref")].children[character.getAttribute("ref")] = menuItem;
                    }
                }
            }
        }
        return {
            items, itemsHierarchy, flatItemsHierarchy,
            descriptors, descriptorsHierarchy, flatDescriptorsHierarchy
        };
    }

    window.SDD = window.SDD ?? {};
    window.SDD.load = loadSDD;
}());