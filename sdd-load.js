(function () { "use strict;"
    async function loadSDD(file) {
        const text = await file.text();
        const node = new DOMParser().parseFromString(text, "text/xml").firstElementChild;
        
        const items = {};
        const itemsHierarchy = {};
        const tmpHierarchyByHID = {};
        const characters = {};
        const charactersHierarchy = {};
        
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
                    name: label.textContent,
                    detail: detail.textContent,
                    photo: imagesById.get(mediaObject?.getAttribute("ref"))
                };
            }

            const taxonHierarchies = dataset.getElementsByTagName("TaxonHierarchies")[0];
            const taxonNameByHierarchyId = new Map();

            for (const taxonHierarchy of taxonHierarchies.getElementsByTagName("TaxonHierarchy")) {
                const nodes = taxonHierarchy.getElementsByTagName("Nodes")[0];

                for (const node of nodes.getElementsByTagName("Node")) {
                    const taxonName = node.getElementsByTagName("TaxonName")[0];
                    const taxonId = taxonName.getAttribute("ref");
                    const parent = node.getElementsByTagName("Parent");
                    const tmpHierarchyItem = tmpHierarchyByHID[node.getAttribute("id")];

                    taxonNameByHierarchyId.set(node.getAttribute("id"), taxonId);

                    const hierarchyItem = tmpHierarchyItem ?? {
                        entry: items[taxonId],
                        children: {},
                        open: false
                    };
                    if (typeof tmpHierarchyItem !== "undefined") {
                        tmpHierarchyItem.entry = items[taxonId];
                        tmpHierarchyByHID[node.getAttribute("id")] = undefined;
                    }
                    if (parent.length === 0 && typeof itemsHierarchy[taxonId] === "undefined") {
                        itemsHierarchy[taxonId] = hierarchyItem;
                    } else {
                        const parentTaxonId = taxonNameByHierarchyId.get(parent[0].getAttribute("ref"));

                        if (typeof itemsHierarchy[parentTaxonId] === "undefined") {
                            tmpHierarchyByHID[parent[0].getAttribute("ref")] = {
                                entry: undefined,
                                children: { [taxonId]: hierarchyItem },
                                open: false
                            };
                        } else {
                            itemsHierarchy[parentTaxonId].children[taxonId] = hierarchyItem;
                        }
                    }
                }
            }

            const characters = dataset.getElementsByTagName("Characters")[0];

            for (const character of characters.getElementsByTagName("CategoricalCharacter")) {
                const representation = character.getElementsByTagName("Representation")[0];
                const label = representation.getElementsByTagName("Label")[0];

                characters[character.getAttribute("id")] = {
                    name: label.textContent,
                    states: []
                };
            }

            for (const character of characters.getElementsByTagName("QuantitativeCharacter")) {
                const representation = character.getElementsByTagName("Representation")[0];
                const label = representation.getElementsByTagName("Label")[0];

                characters[character.getAttribute("id")] = {
                    name: label.textContent,
                    states: []
                };
            }

            const concepts = {};
            const descriptiveConcepts = dataset.getElementsByTagName("DescriptiveConcepts")[0];

            for (const descriptiveConcept of descriptiveConcepts.getElementsByTagName("DescriptiveConcept")) {
                const representation = descriptiveConcept.getElementsByTagName("Representation")[0];
                const label = representation.getElementsByTagName("Label")[0];

                concepts[descriptiveConcept.getAttribute("id")] = { name: label.textContent };
            }

            const characterTrees = dataset.getElementsByTagName("CharacterTrees")[0];
            const conceptIdByHierarchyId = new Map();

            for (const characterTree of characterTrees.getElementsByTagName("CharacterTree")) {
                const nodes = characterTree.getElementsByTagName("Nodes")[0];

                for (const node of nodes.getElementsByTagName("Node")) {
                    const descriptiveConcept = node.getElementsByTagName("DescriptiveConcept")[0];
                    conceptIdByHierarchyId.set(node.getAttribute("id"), descriptiveConcept.getAttribute("ref"));
                    charactersHierarchy[descriptiveConcept.getAttribute("ref")] = {
                        entry: concepts[descriptiveConcept.getAttribute("ref")],
                        children: {},
                        open: false
                    };
                }

                for (const charNode of nodes.getElementsByTagName("CharNode")) {
                    const parent = charNode.getElementsByTagName("Parent");
                    const character = charNode.getElementsByTagName("Character")[0];
                    const menuItem =  {
                        entry: characters[character.getAttribute("ref")],
                        children: {},
                        open: false
                    };

                    if (parent.length > 0) {
                        const parentId = conceptIdByHierarchyId.get(parent[0].getAttribute("ref"));
                        charactersHierarchy[parentId].children[character.getAttribute("ref")] = menuItem;
                    } else {
                        charactersHierarchy[character.getAttribute("ref")] = menuItem;
                    }
                }
            }
        }
        return { items, itemsHierarchy, characters, charactersHierarchy };
    }

    window.SDD = window.SDD ?? {};
    window.SDD.load = loadSDD;
}());