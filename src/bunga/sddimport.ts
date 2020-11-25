import { Character as sdd_Character, Dataset as sdd_Dataset, Representation, State as sdd_State, Taxon as sdd_Taxon } from "../sdd/datatypes";
import { Character, DetailData, Field, State, Taxon } from "./datatypes";
import { Dataset } from "./Dataset";
import { standardFields } from "./stdcontent";
import { createDetailData } from "./DetailData";
import { createCharacter } from "./Character";
import { createTaxon } from "./Taxon";
import { picturesFromPhotos } from './picture';
import { ManyToManyBimap } from '@/tools/bimaps';
import { Hierarchy, IMap } from './hierarchy';
import { CharactersHierarchy } from './CharactersHierarchy';

type MapContructor<T> = { new (): IMap<T> };

function stateFromSdd(state:sdd_State, photosByRef: Record<string, string>): State {
    return {
        id: state.id,
        descriptorId: state.characterId,
        name: state.label,
        nameEN: "",
        nameCN: "",
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

function taxonFromSdd(taxon:sdd_Taxon, extraFields: Field[], photosByRef: Record<string, string>): Taxon {
    return createTaxon({
        parentId: taxon.parentId,
        childrenIds: taxon.childrenIds,
        ...detailDataFromSdd(taxon.id, taxon, extraFields, photosByRef)
    });
}

function extractStatesByTaxons(sddContent: sdd_Dataset): ManyToManyBimap {
    const statesByTaxons = new ManyToManyBimap();
    for (const taxon of sddContent.taxons) {
        for (const categorical of taxon.categoricals) {
            for (const stateRef of categorical.stateRefs) {
                statesByTaxons.add(taxon.id, stateRef.ref);
            }
        }
    }
    return statesByTaxons;
}

function extractStatesById(sddContent: sdd_Dataset, photosByRef: Record<string, string>) {
	const statesById: Record<string, State> = {};

	for (const state of sddContent.states) {
		statesById[state.id] = stateFromSdd(state, photosByRef);
	}
	return statesById;
}

function extractTaxonsHierarchy(makeMap: MapContructor<Taxon>, sddContent: sdd_Dataset, extraFields: Field[], photosByRef: Record<string, string>): Hierarchy<Taxon> {
	const taxons = new Hierarchy<Taxon>("t", new makeMap());

	for (const taxon of sddContent.taxons) {
        taxons.add(taxonFromSdd(taxon, extraFields, photosByRef));
	}
	return taxons;
}

function extractCharactersHierarchy(makeMap: MapContructor<Character>, sddContent: sdd_Dataset, statesById: Record<string, State>, photosByRef: Record<string, string>): CharactersHierarchy {
	const characters = new CharactersHierarchy("c", new makeMap());

	for (const character of sddContent.characters) {
		characters.add(characterFromSdd(character, photosByRef, statesById));
	}
	return characters;
}

function extractPhotosByRef(sddContent: sdd_Dataset) {
	const photosByRef: Record<string, string> = {};

	for (const mediaObject of sddContent.mediaObjects) {
		photosByRef[mediaObject.id] = mediaObject.source;
	}
	return photosByRef;
}

export function datasetFromSdd(makeMap: MapContructor<any>, dataset: sdd_Dataset, extraFields: Field[]): Dataset {
	const photosByRef = extractPhotosByRef(dataset);
	const statesById = extractStatesById(dataset, photosByRef);
	const descriptors = extractCharactersHierarchy(makeMap, dataset, statesById, photosByRef);
    const taxons = extractTaxonsHierarchy(makeMap, dataset, extraFields, photosByRef);
    const statesByTaxons = extractStatesByTaxons(dataset);

	return new Dataset("0", taxons, descriptors, statesById, statesByTaxons);
}