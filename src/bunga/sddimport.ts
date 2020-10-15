import { Character as sdd_Character, Dataset as sdd_Dataset, Representation, State as sdd_State, Taxon as sdd_Taxon } from "../sdd/datatypes";
import { Character, Dataset, Description, DetailData, Field, State, Taxon } from "./datatypes";
import { standardFields } from "./stdcontent";
import { createDataset } from "./Dataset";
import { createDetailData } from "./DetailData";
import { createCharacter } from "./Character";
import { createTaxon } from "./Taxon";
import { picturesFromPhotos } from './pictures';

function stateFromSdd(state:sdd_State, photosByRef: Record<string, string>): State {
    return {
        id: state.id,
        descriptorId: state.characterId,
        name: state.label,
        photos: picturesFromPhotos(state.mediaObjectsRefs?.map(m => photosByRef[m.ref])),
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

function detailDataFromSdd(id: string, representation: Representation, extraFields: Field[], photosByRef: Record<string, string>): DetailData {
    const names = representation.label.split("/");
    const name = names[0], author = names[1], nameCN = names[2];

    const fields = standardFields.concat(extraFields);
    const floreRe = /Flore Madagascar et Comores\s*<br>\s*fasc\s+(\d*)\s*<br>\s*page\s+(null|\d*)/i;
    let fasc: number|undefined = undefined, page: number|undefined = undefined;
    const match = representation.detail.match(floreRe);

    if (match) {
        fasc = parseInt(match[1]);
        page = parseInt(match[2]);
    }
    let detail = removeFromDescription(representation.detail, fields.map(field => field.label)).replace(floreRe, "");

    const emptyParagraphRe = /<p>(\n|\t|\s|<br>|&nbsp;)*<\/p>/gi;
    if (detail.match(emptyParagraphRe)) {
        detail = detail.replace(emptyParagraphRe, "");
    }
    const photos = representation.mediaObjectsRefs.map(m => photosByRef[m.ref]);
    const data = createDetailData({ id: id, name: name, author: author, nameCN: nameCN, fasc: fasc, page: page, detail: detail, photos: photos });

    for (const field of fields) {
        ((field.std) ? data : data.extra)[field.id] = findInDescription(representation.detail, field.label);
    }
    return data;
}

function characterFromSdd(character: sdd_Character, photosByRef: Record<string, string>, statesById: Record<string, State>): Character {
    return createCharacter({
        parentId: character.parentId,
        childrenIds: character.childrenIds,
        states: character.states?.map(s => statesById[s.id]),
        inapplicableStates: character.inapplicableStatesRefs?.map(s => statesById[s.ref]),
        ...detailDataFromSdd(character.id, character, [], photosByRef),
    });
}

function taxonFromSdd(taxon:sdd_Taxon, extraFields: Field[], photosByRef: Record<string, string>, descriptors: Record<string, Character>): Taxon {
    const statesSelection: Record<string, boolean> = {};
    for (const categorical of taxon.categoricals) {
        for (const stateRef of categorical.stateRefs) {
            statesSelection[stateRef.ref] = true;
        }
    }
    return createTaxon({
        parentId: taxon.parentId,
        childrenIds: taxon.childrenIds,
        statesSelection: statesSelection,
        ...detailDataFromSdd(taxon.id, taxon, extraFields, photosByRef)
    });
}

function extractStatesById(sddContent: sdd_Dataset, photosByRef: Record<string, string>) {
	const statesById: Record<string, State> = {};

	for (const state of sddContent.states) {
		statesById[state.id] = stateFromSdd(state, photosByRef);
	}
	return statesById;
}

function extractItemsById(sddContent: sdd_Dataset, descriptors: Record<string, Character>, extraFields: Field[], statesById: Record<string, State>, photosByRef: Record<string, string>) {
	const itemsById: Record<string, Taxon> = {};

	for (const taxon of sddContent.taxons) {
		itemsById[taxon.id] = taxonFromSdd(taxon, extraFields, photosByRef, descriptors);
	}
	return itemsById;
}

function extractDescriptorsById(sddContent: sdd_Dataset, statesById: Record<string, State>, photosByRef: Record<string, string>) {
	const descriptorsById: Record<string, Character> = {};

	for (const character of sddContent.characters) {
		descriptorsById[character.id] = characterFromSdd(character, photosByRef, statesById);
	}
	return descriptorsById;
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
	const descriptors = extractDescriptorsById(dataset, statesById, photosByRef);
	const taxons = extractItemsById(dataset, descriptors, extraFields, statesById, photosByRef);

	return createDataset("0", taxons, descriptors);
}