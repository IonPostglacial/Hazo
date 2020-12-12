import { standardFields } from "@/datatypes";

function saveSDD({ items, descriptors, extraFields }) {
    const xml = document.implementation.createDocument("http://rs.tdwg.org/UBIF/2006/", "Datasets");
    const datasets = xml.documentElement;
    
    const technicalMetadata = xml.createElement("TechnicalMetadata");
    const generator = xml.createElement("Generator");
    generator.setAttribute("name", "Bunga");
    generator.setAttribute("notes", "This software is developed and distributed by Li Tian & Nicolas Galipot - Copyright (c) 2020");
    generator.setAttribute("version", "0.9");

    technicalMetadata.setAttribute("created", new Date().toISOString());
    technicalMetadata.appendChild(generator);

    datasets.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    datasets.setAttribute("xsi:schemaLocation", "http://rs.tdwg.org/UBIF/2006/Schema/1.1/SDD.xsd");
    
    const dataset = xml.createElement("Dataset");
    dataset.appendChild(technicalMetadata);
    dataset.setAttribute("xml:lang", "fr");
    dataset.appendChild(createRepresentation(xml, { name: "Sample" }));

    datasets.appendChild(dataset);

    const mediaObjects = xml.createElement("MediaObjects");
    let mediaObjectsCount = 0;

    function newMediaObject(label, detail, src) {
        mediaObjectsCount++;
        const mediaObject = xml.createElement("MediaObject");
        const id = `m${mediaObjectsCount}`;
        const source = xml.createElement("Source");
        source.setAttribute("href", src);

        mediaObject.setAttribute("id", id);
        mediaObject.appendChild(createRepresentation(xml, { name: `${label} - ${mediaObjectsCount}`, detail }, "Caption"));
        mediaObject.appendChild(Object.assign(xml.createElement("Type"), { textContent: "Image" }));
        mediaObject.appendChild(source);

        mediaObjects.appendChild(mediaObject);

        return id;
    }

    function createRepresentation(xml, item, role = undefined) {
        const representation = xml.createElement("Representation");
        const name = item.name +
            (item.author ? ` / ${item.author}` : "") +
            (item.nameCN ? ` / ${item.nameCN}` : "");
        const label = Object.assign(xml.createElement("Label"), { textContent: name || "_" });
        representation.appendChild(label);
        const fields = [...standardFields, ...(extraFields ?? [])];
        let itemDetail = "";
        for (const { id, label, std } of fields) {
            const value = std ? item[id] : (item.extra ? item.extra[id] : null);
            if (typeof value === "undefined" || value === null) continue;
            itemDetail += `${label}: ${value}<br><br>`;
        }
        itemDetail +=
            (item.fasc ? `Flore Madagascar et Comores<br>fasc ${item.fasc}<br>page ${item.page ?? ""}<br><br>` : "") +
            (item.detail ?? "");
        if (itemDetail) {
            const detail = Object.assign(xml.createElement("Detail"), { textContent: itemDetail });
            if (typeof role !== "undefined") {
                detail.setAttribute("role", role);
            }
            representation.appendChild(detail);
        }
        for (const photo of item.photos ?? []) {
            const ref = newMediaObject(item.name, item.details, photo);
            const mediaObject = xml.createElement("MediaObject");
            mediaObject.setAttribute("ref", ref);
            representation.appendChild(mediaObject);
        }
        return representation;
    }

    // Taxon Names

    const taxonNames = xml.createElement("TaxonNames");
    dataset.appendChild(taxonNames);

    for (const item of Object.values(items)) {
        const taxonName = xml.createElement("TaxonName");

        taxonName.setAttribute("id", item.id);
        taxonName.appendChild(createRepresentation(xml, item));

        taxonNames.appendChild(taxonName);
    }

    // Taxon Hierarchies

    const taxonHierarchies = xml.createElement("TaxonHierarchies");
    const taxonHierarchy = xml.createElement("TaxonHierarchy");
    taxonHierarchy.setAttribute("id", "th1");
    const nodes = xml.createElement("Nodes");

    taxonHierarchy.appendChild(createRepresentation(xml, { name: "Default Entity Tree" }));
    taxonHierarchy.appendChild(Object.assign(xml.createElement("TaxonHierarchyType"), { textContent: "UnspecifiedTaxonomy" }));
    taxonHierarchy.appendChild(nodes);

    taxonHierarchies.appendChild(taxonHierarchy);
    dataset.appendChild(taxonHierarchies);

    (function addItemHierarchyNode(hierarchies, parentRef) {
        for (const hierarchy of Object.values(hierarchies)) {
            const node = xml.createElement("Node");

            if (typeof parentRef !== "undefined") {
                const parent = xml.createElement("Parent");
                parent.setAttribute("ref", parentRef);
                node.appendChild(parent);
            }

            const taxonName = xml.createElement("TaxonName");
            taxonName.setAttribute("ref", hierarchy.id);

            node.appendChild(taxonName);
            node.setAttribute("id", hierarchy.hid);

            nodes.appendChild(node);

            addItemHierarchyNode(hierarchy.children, hierarchy.hid);
        }
    }(Object.fromEntries(Object.entries(items).filter(([, h]) => h.topLevel))));

    // Characters

    const descriptiveConcepts = xml.createElement("DescriptiveConcepts");
    dataset.appendChild(descriptiveConcepts);

    const characters = xml.createElement("Characters");
    dataset.appendChild(characters);

    for (const [id, descriptor] of Object.entries(descriptors)) {
        const character = xml.createElement("CategoricalCharacter");
        character.setAttribute("id", id);
        character.appendChild(createRepresentation(xml, descriptor));
        const states = xml.createElement("States");

        for (const state of Object.values(descriptor.states)) {
            const stateDefinition = xml.createElement("StateDefinition");
            stateDefinition.setAttribute("id", state.id);
            stateDefinition.appendChild(createRepresentation(xml, state));

            states.appendChild(stateDefinition);
        }
        if (states.children.length > 0) {
            character.appendChild(states);
        }
        characters.appendChild(character);
    }
    
    // Character Trees

    const characterTrees = xml.createElement("CharacterTrees");
    
    const characterTree = xml.createElement("CharacterTree");
    characterTree.setAttribute("id", "ct1");
    characterTree.appendChild(createRepresentation(xml, { name: "Ordre et dependance entre caracteres" }));
    characterTree.appendChild(Object.assign(xml.createElement("ShouldContainAllCharacters"), { textContent: "true" }));
    const charTreeNodes = xml.createElement("Nodes");
    characterTree.appendChild(charTreeNodes);
    
    const characterTreeConcepts = xml.createElement("CharacterTree");
    characterTreeConcepts.setAttribute("id", "ct2");
    characterTreeConcepts.appendChild(createRepresentation(xml, { name: "Arbre secondaire Xper2 : groupes et variables contenues dans ces groupes" }));
    const charTreeConceptsNodes = xml.createElement("Nodes");
    characterTreeConcepts.appendChild(charTreeConceptsNodes);

    (function addDescriptorHierarchyNodes (hierarchy, nodesElement, parentRef) {
        for (const descriptorHierarchy of Object.values(hierarchy)) {
            let node;
            if (descriptorHierarchy.type === "concept") {
                const descriptiveConcept = node = xml.createElement("DescriptiveConcept");
                descriptiveConcept.setAttribute("id", descriptorHierarchy.id);
                descriptiveConcept.appendChild(createRepresentation(xml, descriptorHierarchy));
                descriptiveConcepts.appendChild(descriptiveConcept);

                const descriptiveConceptElement = xml.createElement("DescriptiveConcept");
                descriptiveConceptElement.setAttribute("ref", descriptorHierarchy.id);

                const nodeElement = xml.createElement("Node");
                nodeElement.setAttribute("id", descriptorHierarchy.hid);
                nodeElement.appendChild(descriptiveConceptElement);

                charTreeConceptsNodes.appendChild(nodeElement);
                    
                addDescriptorHierarchyNodes(descriptorHierarchy.children, charTreeConceptsNodes, descriptorHierarchy.hid);
            } else if (descriptorHierarchy.type === "character") {
                const charNode = node = xml.createElement("CharNode");
                const character = xml.createElement("Character");
                character.setAttribute("ref", descriptorHierarchy.id);
                
                const dependencyRules = xml.createElement("DependencyRules");
                const inapplicableIf = xml.createElement("InapplicableIf");
                
                for (const inapplicableState of descriptorHierarchy.inapplicableStates ?? []) {
                    const state = xml.createElement("State");
                    state.setAttribute("ref", inapplicableState.id);
                    inapplicableIf.appendChild(state);
                }
                if (inapplicableIf.children.length > 0) {
                    dependencyRules.appendChild(inapplicableIf);
                    charNode.appendChild(dependencyRules);
                }
                charNode.appendChild(character);
                nodesElement.appendChild(charNode);
            }
            if (typeof parentRef !== "undefined") {
                const parent = xml.createElement("Parent");
                parent.setAttribute("ref", parentRef);
                node?.prepend(parent);
            }
        }
    }(descriptors, charTreeNodes));

    characterTrees.appendChild(characterTree);
    if (charTreeConceptsNodes.children.length > 0) {
        characterTrees.appendChild(characterTreeConcepts);
    }
    dataset.appendChild(characterTrees);

    // Coded Descriptions

    const codedDescriptions = xml.createElement("CodedDescriptions");
    let codedDescriptionsCount = 0;

    dataset.appendChild(codedDescriptions);

    for (const item of Object.values(items)) {
        codedDescriptionsCount++;
        const codedDescription = xml.createElement("CodedDescription");
        const taxonName = xml.createElement("TaxonName");
        const scope = xml.createElement("Scope");
        
        taxonName.setAttribute("ref", item.id);
        scope.appendChild(taxonName);

        codedDescription.setAttribute("id", "D" + codedDescriptionsCount);
        codedDescription.appendChild(createRepresentation(xml, item));
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
                if (typeof state === "undefined") { continue; }
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

export default saveSDD;