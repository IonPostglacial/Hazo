(function () { "use strict";
    function createRepresentation(xml, labelText, detailText, mediaObjectsRefs = []) {
        const representation = xml.createElement("Representation");
        const label = Object.assign(xml.createElement("Label"), { textContent: labelText });
        representation.appendChild(label);

        if (typeof detailText !== "undefined" && detailText !== "") {
            const detail = Object.assign(xml.createElement("Detail"), { textContent: detailText });
            representation.appendChild(detail);
        }

        for (const ref of mediaObjectsRefs) {
            const mediaObject = xml.createElement("MediaObject");

            mediaObject.setAttribute("ref", ref);
            representation.appendChild(mediaObject);
        }

        return representation;
    }

    function saveSDD({ items, itemsHierarchy, descriptors, descriptorsHierarchy }) {
        const xml = document.implementation.createDocument("http://rs.tdwg.org/UBIF/2006/", "Datasets");
        const datasets = xml.documentElement;

        datasets.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        datasets.setAttribute("xsi:schemaLocation", "http://rs.tdwg.org/UBIF/2006/Schema/1.1/SDD.xsd");

        datasets.innerHTML += `
            <TechnicalMetadata created="${new Date().toISOString()}">
                <Generator name="Bunga"
                    notes="This software is developed and distributed by Nicolas Galipot - Copyright (c) 2020" version="0.9"/>
            </TechnicalMetadata>
        `;
        const dataset = xml.createElement("Dataset");
        datasets.appendChild(dataset);
        dataset.setAttribute("xml:lang", "fr");

        dataset.appendChild(createRepresentation(xml, "Sample"));

        const mediaObjects = xml.createElement("MediaObjects");
        let mediaObjectsCount = 0;

        function newMediaObject(label, detail, src) {
            mediaObjectsCount++;
            const mediaObject = xml.createElement("MediaObject");
            const id = `m${mediaObjectsCount}`;
            const source = xml.createElement("Source");
            source.setAttribute("href", src);

            mediaObject.setAttribute("id", id);
            mediaObject.appendChild(createRepresentation(xml, `${label} - ${mediaObjectsCount}`, detail));
            mediaObject.appendChild(Object.assign(xml.createElement("Type"), { textContent: "Image" }));
            mediaObject.appendChild(source);

            mediaObjects.appendChild(mediaObject);

            return id;
        }

        // Taxon Names

        const taxonNames = xml.createElement("TaxonNames");
        dataset.appendChild(taxonNames);

        for (const [id, item] of Object.entries(items)) {
            const taxonName = xml.createElement("TaxonName");
            const medias = [];
        
            taxonName.setAttribute("id", id);

            if(typeof taxonName.photo !== "undefined") {
                medias.push(newMediaObject(item.name, item.details, item.photo));
            }

            const itemDetail = "" +
                (item.vernacularName   ? `NV: ${item.vernacularName}<br><br>` : "") +
                (item.meaning          ? `Sense: ${item.meaning}<br><br>` : "") +
                (item.noHerbier        ? `N° Herbier: ${item.noHerbier}<br><br>` : "") +
                (item.herbariumPicture ? `Herbarium Picture: ${item.herbariumPicture}<br><br>` : "") +
                (item.fasc             ? `Flore Madagascar et Comores<br>fasc ${item.fasc}<br>page ${item.page}<br><br>` : "") +
                (item.detail);
            taxonName.appendChild(createRepresentation(xml, item.name, itemDetail, medias));

            taxonNames.appendChild(taxonName);
        }

        // Taxon Hierarchies

        const taxonHierarchies = xml.createElement("TaxonHierarchies");
        const taxonHierarchy = xml.createElement("TaxonHierarchy");
        taxonHierarchy.setAttribute("id", "th1");
        const nodes = xml.createElement("Nodes");

        taxonHierarchy.appendChild(createRepresentation(xml, "Default Entity Tree"));
        taxonHierarchy.appendChild(Object.assign(xml.createElement("TaxonHierarchyType"), { textContent: "UnspecifiedTaxonomy" }));
        taxonHierarchy.appendChild(nodes);

        taxonHierarchies.appendChild(taxonHierarchy);
        dataset.appendChild(taxonHierarchies);

        (function addItemHierarchyNode(hierarchies, parentRef) {
            for (const [id, hierarchy] of Object.entries(hierarchies)) {
                const node = xml.createElement("Node");

                if (typeof parentRef !== "undefined") {
                    const parent = xml.createElement("Parent");
                    parent.setAttribute("ref", parentRef);
                    node.appendChild(parent);
                }

                const taxonName = xml.createElement("TaxonName");
                taxonName.setAttribute("ref", hierarchy.entry.id);
    
                node.appendChild(taxonName);
                node.setAttribute("id", hierarchy.id);
    
                nodes.appendChild(node);

                addItemHierarchyNode(hierarchy.children, hierarchy.id);
            }
        }(Object.fromEntries(Object.entries(itemsHierarchy).filter(([_, h]) => h.topLevel))));

        // Characters

        const descriptiveConcepts = xml.createElement("DescriptiveConcepts");
        dataset.appendChild(descriptiveConcepts);

        const characters = xml.createElement("Characters");
        dataset.appendChild(characters);

        for (const [id, descriptor] of Object.entries(descriptors)) {
            const character = xml.createElement("CategoricalCharacter");
            const charMedias = [];

            if (typeof descriptor.photo !== "undefined") {
                charMedias.push(newMediaObject(descriptor.name, descriptor.detail, descriptor.photo));
            }

            character.setAttribute("id", id);
            character.appendChild(createRepresentation(xml, descriptor.name, descriptor.detail, charMedias));
            const states = xml.createElement("States");

            for (const [stateId, state] of Object.entries(descriptor.states)) {
                const stateDefinition = xml.createElement("StateDefinition");
                const stateMedias = [];

                if (typeof state.photo !== "undefined") {
                    stateMedias.push(newMediaObject(state.name, state.detail, state.photo))
                }

                stateDefinition.setAttribute("id", state.id);
                stateDefinition.appendChild(createRepresentation(xml, state.name, state.detail, stateMedias));

                states.appendChild(stateDefinition);
            }

            character.appendChild(states);
            characters.appendChild(character);
        }
        
        // Character Trees

        const characterTrees = xml.createElement("CharacterTrees");
        
        const characterTree = xml.createElement("CharacterTree");
        characterTree.setAttribute("id", "ct1");
        characterTree.appendChild(createRepresentation(xml, "Ordre et dependance entre caracteres"));
        characterTree.appendChild(Object.assign(xml.createElement("ShouldContainAllCharacters"), { textContent: "true" }));
        const charTreeNodes = xml.createElement("Nodes");
        characterTree.appendChild(charTreeNodes);
        
        const characterTreeConcepts = xml.createElement("CharacterTree");
        characterTreeConcepts.setAttribute("id", "ct2");
        characterTreeConcepts.appendChild(createRepresentation(xml, "Arbre secondaire Xper2 : groupes et variables contenues dans ces groupes"));
        const charTreeConceptsNodes = xml.createElement("Nodes");
        characterTreeConcepts.appendChild(charTreeConceptsNodes);

        (function addDescriptorHierarchyNodes (hierarchy, nodesElement, parentRef) {
            for (const [id, descriptorHierarchy] of Object.entries(hierarchy)) {
                let node;
                if (descriptorHierarchy.type === "concept") {
                    const descriptiveConcept = node = xml.createElement("DescriptiveConcept");
                    descriptiveConcept.setAttribute("id", descriptorHierarchy.entry.id);
                    descriptiveConcept.appendChild(createRepresentation(xml,
                        descriptorHierarchy.entry.name, descriptorHierarchy.entry.detail));
                    descriptiveConcepts.appendChild(descriptiveConcept);

                    const descriptiveConceptElement = xml.createElement("DescriptiveConcept");
                    descriptiveConceptElement.setAttribute("ref", descriptorHierarchy.entry.id);

                    const nodeElement = xml.createElement("Node");
                    nodeElement.setAttribute("id", descriptorHierarchy.id);
                    nodeElement.appendChild(descriptiveConceptElement);

                    charTreeConceptsNodes.appendChild(nodeElement);
                        
                    addDescriptorHierarchyNodes(descriptorHierarchy.children, charTreeConceptsNodes, descriptorHierarchy.id);
                } else if (descriptorHierarchy.type === "character") {
                    const dependencyRules = xml.createElement("DependencyRules");
                    const inapplicableIf = xml.createElement("InapplicableIf");
        
                    for (const inapplicableState of descriptorHierarchy.entry.inapplicableStates ?? []) {
                        const state = xml.createElement("State");
                        state.setAttribute("ref", inapplicableState.id);
                        inapplicableIf.appendChild(state);
                    }
                    if (inapplicableIf.children.length > 0) {
                        dependencyRules.appendChild(inapplicableIf);
                    }
                    const charNode = node = xml.createElement("CharNode");
                    const character = xml.createElement("Character");
                    character.setAttribute("ref", descriptorHierarchy.entry.id);
                    
                    charNode.appendChild(dependencyRules);
                    charNode.appendChild(character);

                    nodesElement.appendChild(charNode);
                }
                if (typeof parentRef !== "undefined") {
                    const parent = xml.createElement("Parent");
                    parent.setAttribute("ref", parentRef);
                    node?.prepend(parent);
                }
            }
        }(descriptorsHierarchy, charTreeNodes));

        characterTrees.appendChild(characterTree);
        if (charTreeConceptsNodes.children.length > 0) {
            characterTrees.appendChild(characterTreeConcepts);
        }
        dataset.appendChild(characterTrees);

        // Coded Descriptions

        const codedDescriptions = xml.createElement("CodedDescriptions");
        let codedDescriptionsCount = 0;

        dataset.appendChild(codedDescriptions);

        for (const [id, item] of Object.entries(items)) {
            codedDescriptionsCount++;
            const codedDescription = xml.createElement("CodedDescription");
            const taxonName = xml.createElement("TaxonName");
            const scope = xml.createElement("Scope");
            
            taxonName.setAttribute("ref", id);
            scope.appendChild(taxonName);

            codedDescription.setAttribute("id", "D" + codedDescriptionsCount);
            codedDescription.appendChild(createRepresentation(xml, item.name, item.detail));
            codedDescription.appendChild(scope);

            const summaryData = xml.createElement("SummaryData");

            for (const description of item.descriptions ?? []) {
                const categorical = xml.createElement("Categorical");
                categorical.setAttribute("ref", description.descriptor.id);
                
                const ratings = xml.createElement("Ratings");
                const rating = xml.createElement("Rating");
                rating.setAttribute("context", "ObservationConvenience");
                rating.setAttribute("rating", "Rating3of5");

                ratings.appendChild(rating);
                categorical.appendChild(ratings);

                for (const state of description.states) {
                    const stateElement = xml.createElement("State");
                    stateElement.setAttribute("ref", state.id);
                    categorical.appendChild(stateElement);
                }

                summaryData.appendChild(categorical);
            }

            codedDescription.appendChild(summaryData);

            codedDescriptions.appendChild(codedDescription);
        }

        dataset.appendChild(mediaObjects);

        return xml;
    }

    window.SDD = window.SDD ?? {};
    window.SDD.save = saveSDD;
}());