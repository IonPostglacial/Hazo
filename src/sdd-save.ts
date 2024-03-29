import { standardFields } from "@/datatypes";
import { Dataset, taxonDescriptions } from "./datatypes/Dataset";
import { forEachHierarchy, Hierarchy } from "./datatypes/hierarchy";
import { BasicInfo, Taxon } from "./datatypes/types";

type Item = BasicInfo & { detail?: string, author?: string, fasc?: number, page?: number, extra?: any };

function saveSDD(ds: Dataset): Document {
    const xml = document.implementation.createDocument("http://rs.tdwg.org/UBIF/2006/", "Datasets");
    const datasets = xml.documentElement;
    
    const technicalMetadata = xml.createElement("TechnicalMetadata");
    const generator = xml.createElement("Generator");
    generator.setAttribute("name", "Hazo");
    generator.setAttribute("notes", "This software is developed and distributed by Li Tian & Nicolas Galipot - Copyright (c) 2020");
    generator.setAttribute("version", "0.9");

    technicalMetadata.setAttribute("created", new Date().toISOString());
    technicalMetadata.appendChild(generator);

    datasets.setAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    datasets.setAttribute("xsi:schemaLocation", "http://rs.tdwg.org/UBIF/2006/Schema/1.1/SDD.xsd");
    
    const dataset = xml.createElement("Dataset");
    dataset.appendChild(technicalMetadata);
    dataset.setAttribute("xml:lang", "fr");
    dataset.appendChild(createRepresentation(xml, { id: "", name: { S: "Sample" }, pictures: [] }));

    datasets.appendChild(dataset);

    const mediaObjects = xml.createElement("MediaObjects");
    let mediaObjectsCount = 0;

    function newMediaObject(label: string, detail: string, src: string) {
        mediaObjectsCount++;
        const mediaObject = xml.createElement("MediaObject");
        const id = `m${mediaObjectsCount}`;
        const source = xml.createElement("Source");
        source.setAttribute("href", src);

        mediaObject.setAttribute("id", id);
        mediaObject.appendChild(createRepresentation(xml, { id: "", pictures: [], name: { S: `${label} - ${mediaObjectsCount}` }, detail }, "Caption"));
        mediaObject.appendChild(Object.assign(xml.createElement("Type"), { textContent: "Image" }));
        mediaObject.appendChild(source);

        mediaObjects.appendChild(mediaObject);

        return id;
    }

    function createRepresentation(xml: Document, item: Item, role: string|undefined = undefined) {
        const representation = xml.createElement("Representation");
        const name = item.name.S +
            (item.author ? ` / ${item.author}` : "") +
            (item.name.CN ? ` / ${item.name.CN}` : "");
        const label = Object.assign(xml.createElement("Label"), { textContent: name || "_" });
        representation.appendChild(label);
        const fields = [...standardFields, ...(ds.extraFields ?? [])];
        let itemDetail = "";
        for (const { id, label, std } of fields) {
            const value = std ? (item as any)[id] : (item.extra ? item.extra[id] : null);
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
        for (const photo of item.pictures ?? []) {
            const ref = newMediaObject(item.name.S, item.detail ?? "", photo.url);
            const mediaObject = xml.createElement("MediaObject");
            mediaObject.setAttribute("ref", ref);
            representation.appendChild(mediaObject);
        }
        return representation;
    }

    // Taxon Names

    const taxonNames = xml.createElement("TaxonNames");
    dataset.appendChild(taxonNames);

    forEachHierarchy(ds.taxonsHierarchy, item => {
        const taxonName = xml.createElement("TaxonName");
    
        taxonName.setAttribute("id", item.id);
        taxonName.appendChild(createRepresentation(xml, item));
    
        taxonNames.appendChild(taxonName);
    });

    // Taxon Hierarchies

    const taxonHierarchies = xml.createElement("TaxonHierarchies");
    const taxonHierarchy = xml.createElement("TaxonHierarchy");
    taxonHierarchy.setAttribute("id", "th1");
    const nodes = xml.createElement("Nodes");

    taxonHierarchy.appendChild(createRepresentation(xml, { id: "", name: { S: "Default Entity Tree" }, pictures: [] }));
    taxonHierarchy.appendChild(Object.assign(xml.createElement("TaxonHierarchyType"), { textContent: "UnspecifiedTaxonomy" }));
    taxonHierarchy.appendChild(nodes);

    taxonHierarchies.appendChild(taxonHierarchy);
    dataset.appendChild(taxonHierarchies);

    (function addItemHierarchyNode(hierarchy: Hierarchy<Taxon>, parentRef?: string) {
        const node = xml.createElement("Node");

        if (typeof parentRef !== "undefined") {
            const parent = xml.createElement("Parent");
            parent.setAttribute("ref", parentRef);
            node.appendChild(parent);
        }

        const taxonName = xml.createElement("TaxonName");
        taxonName.setAttribute("ref", hierarchy.id);

        node.appendChild(taxonName);
        node.setAttribute("id", hierarchy.id);

        nodes.appendChild(node);
        for (const child of hierarchy.children) {
            addItemHierarchyNode(child, hierarchy.id);
        }
    }(ds.taxonsHierarchy));

    // Characters

    const descriptiveConcepts = xml.createElement("DescriptiveConcepts");
    dataset.appendChild(descriptiveConcepts);

    const characters = xml.createElement("Characters");
    dataset.appendChild(characters);

    forEachHierarchy(ds.charactersHierarchy, descriptor => {
        const character = xml.createElement("CategoricalCharacter");
        character.setAttribute("id", descriptor.id);
        character.appendChild(createRepresentation(xml, descriptor));
        const states = xml.createElement("States");

        if (descriptor.characterType === "discrete") {
            for (const state of descriptor.states) {
                const stateDefinition = xml.createElement("StateDefinition");
                stateDefinition.setAttribute("id", state.id);
                stateDefinition.appendChild(createRepresentation(xml, state));
    
                states.appendChild(stateDefinition);
            }
        }
        if (states.children.length > 0) {
            character.appendChild(states);
        }
        characters.appendChild(character);
    });
    
    // Character Trees

    const characterTrees = xml.createElement("CharacterTrees");
    
    const characterTree = xml.createElement("CharacterTree");
    characterTree.setAttribute("id", "ct1");
    characterTree.appendChild(createRepresentation(xml, { id: "", name: { S: "Ordre et dependance entre caracteres" }, pictures: [] }));
    characterTree.appendChild(Object.assign(xml.createElement("ShouldContainAllCharacters"), { textContent: "true" }));
    const charTreeNodes = xml.createElement("Nodes");
    characterTree.appendChild(charTreeNodes);
    
    const characterTreeConcepts = xml.createElement("CharacterTree");
    characterTreeConcepts.setAttribute("id", "ct2");
    characterTreeConcepts.appendChild(createRepresentation(xml, { id: "", name: { S: "Arbre secondaire Xper2 : groupes et variables contenues dans ces groupes" }, pictures: [] }));
    const charTreeConceptsNodes = xml.createElement("Nodes");
    characterTreeConcepts.appendChild(charTreeConceptsNodes);

    (function addDescriptorHierarchyNodes (descriptorHierarchy, nodesElement, parentRef?: string) {
        let node;
        if (descriptorHierarchy.characterType === "range") {
            const descriptiveConcept = node = xml.createElement("DescriptiveConcept");
            descriptiveConcept.setAttribute("id", descriptorHierarchy.id);
            descriptiveConcept.appendChild(createRepresentation(xml, descriptorHierarchy));
            descriptiveConcepts.appendChild(descriptiveConcept);

            const descriptiveConceptElement = xml.createElement("DescriptiveConcept");
            descriptiveConceptElement.setAttribute("ref", descriptorHierarchy.id);

            const nodeElement = xml.createElement("Node");
            nodeElement.setAttribute("id", descriptorHierarchy.id);
            nodeElement.appendChild(descriptiveConceptElement);

            charTreeConceptsNodes.appendChild(nodeElement);
            for (const child of descriptorHierarchy.children) {
                addDescriptorHierarchyNodes(child, charTreeConceptsNodes, descriptorHierarchy.id);
            }
        } else if (descriptorHierarchy.characterType === "discrete") {
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
    }(ds.charactersHierarchy, charTreeNodes));

    characterTrees.appendChild(characterTree);
    if (charTreeConceptsNodes.children.length > 0) {
        characterTrees.appendChild(characterTreeConcepts);
    }
    dataset.appendChild(characterTrees);

    // Coded Descriptions

    const codedDescriptions = xml.createElement("CodedDescriptions");
    let codedDescriptionsCount = 0;

    dataset.appendChild(codedDescriptions);

    forEachHierarchy(ds.taxonsHierarchy, item => {
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

        for (const description of taxonDescriptions(ds, item) ?? []) {
            const categorical = xml.createElement("Categorical");
            categorical.setAttribute("ref", description.character.id);
            
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
    });

    dataset.appendChild(mediaObjects);

    return xml;
}

export default saveSDD;