import { Character as sdd_Character, Dataset as sdd_Dataset, Representation, State as sdd_State, Taxon as sdd_Taxon } from "../sdd/datatypes";
import { Character, CharactersHierarchy, Dataset, Field, Hierarchy, IMap, State, Taxon } from "@/datatypes";
import { standardFields } from "@/datatypes/stdcontent";
import { picturesFromPhotos } from "@/datatypes/picture";
import { ManyToManyBimap, OneToManyBimap } from '@/tools/bimaps';
import { createCharacter } from "@/datatypes/Character";
import { createTaxon } from "@/datatypes/Taxon";
import { HierarchicalItem } from "@/datatypes/types";
import { createHierarchicalItem } from "@/datatypes/HierarchicalItem";

type MapContructor<T> = { new (): IMap<T> };

function stateFromSdd(state:sdd_State, photosByRef: Record<string, string>): State {
    return {
        id: state.id,
        name: {
            S: state.label,
            V: state.label,
            CN: state.label,
            EN: state.label,
            FR: state.label,
        },
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

function hierarchicalItemFromSdd(id: string, representation: Representation, extraFields: Field[], photosByRef: Record<string, string>): HierarchicalItem {
    const names = representation.label.split("/");
    const name = names[0], nameCN = names[2];
    const photos = representation.mediaObjectsRefs.map(m => photosByRef[m.ref]);
    const data = createHierarchicalItem({ id: id, name: { S: name, CN: nameCN }, type: "", pictures: picturesFromPhotos(photos) });

    return data;
}

function characterFromSdd(character: sdd_Character, photosByRef: Record<string, string>, statesById: IMap<State>): Character {
    return createCharacter({
        ...hierarchicalItemFromSdd(character.id, character, [], photosByRef),
        detail: character.detail,
        inapplicableStates: character.inapplicableStatesRefs?.map(s => statesById.get(s.ref)!),
    });
}

function taxonFromSdd(taxon:sdd_Taxon, extraFields: Field[], photosByRef: Record<string, string>): Taxon {
    const names = taxon.label.split("/");
    const author = names[1];
    const fields = standardFields.concat(extraFields);
    const floreRe = /Flore Madagascar et Comores\s*<br>\s*fasc\s+(\d*)\s*<br>\s*page\s+(null|\d*)/i;
    let fasc: number|undefined = undefined, page: number|undefined = undefined;
    const match = taxon.detail.match(floreRe);

    if (match) {
        fasc = parseInt(match[1]);
        page = parseInt(match[2]);
    }
    let detail = removeFromDescription(taxon.detail, fields.map(field => field.label)).replace(floreRe, "");

    const emptyParagraphRe = /<p>(\n|\t|\s|<br>|&nbsp;)*<\/p>/gi;
    if (detail.match(emptyParagraphRe)) {
        detail = detail.replace(emptyParagraphRe, "");
    }

    const t = createTaxon({
        ...hierarchicalItemFromSdd(taxon.id, taxon, extraFields, photosByRef),
        author: author, fasc: fasc, page: page, detail: detail, 
        parentId: taxon.parentId,
    });
    for (const field of fields) {
        ((field.std) ? t : t.extra)[field.id] = findInDescription(taxon.detail, field.label);
    }
    return t;
}

function extractStatesByTaxons(makeMap: MapContructor<string[]>, sddContent: sdd_Dataset): ManyToManyBimap {
    const statesByTaxons = new ManyToManyBimap(makeMap);
    for (const taxon of sddContent.taxons) {
        for (const categorical of taxon.categoricals) {
            for (const stateRef of categorical.stateRefs) {
                statesByTaxons.add(taxon.id, stateRef.ref);
            }
        }
    }
    return statesByTaxons;
}

function extractStatesByCharacters(makeMap: MapContructor<string[]>, sddContent: sdd_Dataset): OneToManyBimap {
    const statesByCharacters = new OneToManyBimap(makeMap);
    for (const character of sddContent.characters) {
        character.states
        for (const sddState of character.states) {
            statesByCharacters.add(character.id, sddState.id);
        }
    }
    return statesByCharacters;
}

function extractStatesById(makeMap: MapContructor<State>, sddContent: sdd_Dataset, photosByRef: Record<string, string>): IMap<State> {
	const statesById = new makeMap();
	for (const state of sddContent.states) {
		statesById.set(state.id, stateFromSdd(state, photosByRef));
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

function extractCharactersHierarchy(makeMap: MapContructor<any>, sddContent: sdd_Dataset, statesById: IMap<State>, photosByRef: Record<string, string>): CharactersHierarchy {
    const statesByCharacters = extractStatesByCharacters(makeMap, sddContent);
	const characters = new CharactersHierarchy("c", new makeMap(), statesById, statesByCharacters);

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
	const statesById = extractStatesById(makeMap, dataset, photosByRef);
    const taxons = extractTaxonsHierarchy(makeMap, dataset, extraFields, photosByRef);
    const statesByTaxons = extractStatesByTaxons(makeMap, dataset);
	const descriptors = extractCharactersHierarchy(makeMap, dataset, statesById, photosByRef);

	return new Dataset("0", taxons, descriptors, statesByTaxons, new makeMap());
}