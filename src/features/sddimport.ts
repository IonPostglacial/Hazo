import { Character as sdd_Character, Dataset as sdd_Dataset, Representation, State as sdd_State, Taxon as sdd_Taxon } from "../sdd/datatypes";
import { Character, Dataset, Field, iterHierarchy, State, Taxon } from "@/datatypes";
import { addCharacter, addTaxon, createDataset, setTaxonState } from "@/datatypes/Dataset";
import { standardFields } from "@/datatypes/stdcontent";
import { picturesFromPhotos } from "@/datatypes/picture";
import { createCharacter } from "@/datatypes/Character";
import { createTaxon } from "@/datatypes/Taxon";
import { AnyHierarchicalItem } from "@/datatypes/types";
import { createHierarchicalItem } from "@/datatypes/HierarchicalItem";

function stateFromSdd(state:sdd_State, photosByRef: Record<string, string>): State {
    return {
        id: state.id,
        type: "state",
        name: {
            S: state.label,
            V: state.label,
            CN: state.label,
            EN: state.label,
            FR: state.label,
        },
        detail: state.detail,
        pictures: picturesFromPhotos(state.mediaObjectsRefs?.map(m => photosByRef[m.ref])),
    };
}

function escapeRegex(string:String):String {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findInDescription(description: string, section: string) {
    const re = new RegExp(`${escapeRegex(section)}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
    const match = description.match(re);
    if (match) {
        return match[1].trim();
    } else {
        return "";
    }
}

function removeFromDescription(description: string, sections:Array<String>) {
    let desc = description;

    for (const section of sections) {
        const re = new RegExp(`${escapeRegex(section)}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
        desc = desc.replace(re, "");
    }
    return desc;
}

function hierarchicalItemFromSdd(id: string, type: "character" | "taxon", representation: Representation, photosByRef: Record<string, string>): AnyHierarchicalItem {
    const names = representation.label.split("/");
    const name = names[0], nameCN = names[2];
    const photos = representation.mediaObjectsRefs.map(m => photosByRef[m.ref]);
    const data = createHierarchicalItem({ id: id, type, name: { S: name, CN: nameCN }, pictures: picturesFromPhotos(photos) });

    return data;
}

function characterFromSdd(character: sdd_Character, photosByRef: Record<string, string>, statesById: Map<string, State>): Character {
    return createCharacter({
        ...hierarchicalItemFromSdd(character.id, "character", character, photosByRef),
        detail: character.detail,
        inapplicableStates: character.inapplicableStatesRefs?.map(s => statesById.get(s.ref)!),
    });
}

function taxonFromSdd(taxon:sdd_Taxon, extraFields: Field[], photosByRef: Record<string, string>): Taxon {
    const names = taxon.label.split("/");
    const author = names[1];
    const fields = standardFields.concat(extraFields);
    const floreRe = /Flore Madagascar et Comores\s*<br>\s*fasc\s+(\d*)\s*<br>\s*page\s+(null|\d*)/i;
    let fasc: string|undefined = undefined, page: string|undefined = undefined;
    const match = taxon.detail.match(floreRe);

    if (match) {
        fasc = match[1];
        page = match[2];
    }
    let detail = removeFromDescription(taxon.detail, fields.map(field => field.label)).replace(floreRe, "");

    const emptyParagraphRe = /<p>(\n|\t|\s|<br>|&nbsp;)*<\/p>/gi;
    if (detail.match(emptyParagraphRe)) {
        detail = detail.replace(emptyParagraphRe, "");
    }

    const t = createTaxon({
        ...hierarchicalItemFromSdd(taxon.id, "taxon", taxon, photosByRef),
        author: author, fasc: fasc, page: page, detail: detail, 
        parentId: taxon.parentId,
    });
    for (const field of fields) {
        ((field.std) ? t : t.extra as any)[field.id] = findInDescription(taxon.detail, field.label);
    }
    return t;
}

function extractStatesByTaxons(sddContent: sdd_Dataset): Map<string, string[]> {
    const statesByTaxons = new Map<string, string[]>();
    for (const taxon of sddContent.taxons) {
        for (const categorical of taxon.categoricals) {
            for (const stateRef of categorical.stateRefs) {
                const stateIds = statesByTaxons.get(taxon.id) ?? [];
                stateIds.push(stateRef.ref);
                statesByTaxons.set(taxon.id, stateIds);
            }
        }
    }
    return statesByTaxons;
}

function extractStatesById(sddContent: sdd_Dataset, photosByRef: Record<string, string>): Map<string, State> {
	const statesById = new Map();
	for (const state of sddContent.states) {
		statesById.set(state.id, stateFromSdd(state, photosByRef));
	}
	return statesById;
}

function extractTaxonsHierarchy(ds: Dataset, sddContent: sdd_Dataset, extraFields: Field[], photosByRef: Record<string, string>) {
	for (const taxon of sddContent.taxons) {
        addTaxon(ds, taxonFromSdd(taxon, extraFields, photosByRef));
	}
}

function extractCharactersHierarchy(ds: Dataset, sddContent: sdd_Dataset, statesById: Map<string, State>, photosByRef: Record<string, string>) {
	for (const character of sddContent.characters) {
		addCharacter(ds, characterFromSdd(character, photosByRef, statesById));
	}
}

function extractPhotosByRef(sddContent: sdd_Dataset) {
	const photosByRef: Record<string, string> = {};

	for (const mediaObject of sddContent.mediaObjects) {
		photosByRef[mediaObject.id] = mediaObject.source;
	}
	return photosByRef;
}

export function datasetFromSdd(dataset: sdd_Dataset, extraFields: Field[]): Dataset {
	const photosByRef = extractPhotosByRef(dataset);
	const statesById = extractStatesById(dataset, photosByRef);
    const statesByTaxons = extractStatesByTaxons(dataset);
    const ds = createDataset({ 
        id: "0", 
        taxonsHierarchy: createTaxon({ id: "t0", name: { S: "<TOP>" }}), 
        charactersHierarchy: createCharacter({ id: "c0", name: { S: "<TOP>" } }), 
        books: [], 
        extraFields: [], 
        statesById 
    });
    extractTaxonsHierarchy(ds, dataset, extraFields, photosByRef);
    for (const taxon of iterHierarchy(ds.taxonsHierarchy)) {
        statesByTaxons.get(taxon.id)?.forEach(stateId => {
            const state = statesById.get(stateId);
            if (typeof state !== "undefined") {
                setTaxonState(ds, taxon.id, state);
            }
        });
    }
	extractCharactersHierarchy(ds, dataset, statesById, photosByRef);
	return ds;
}