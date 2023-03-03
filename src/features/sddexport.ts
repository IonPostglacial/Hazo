import type { Character as sdd_Character, Dataset as sdd_Dataset, MediaObject as sdd_MediaObject, State as sdd_State, Taxon as sdd_Taxon, MediaObject, Representation } from "../sdd/datatypes";
import { Character, Dataset, Field, State, Taxon } from "@/datatypes";


interface SddStateData {
    state: sdd_State;
    mediaObjects: MediaObject[];
}

interface SddCharacterData {
	character: sdd_Character;
	states:Array<sdd_State>;
	mediaObjects:Array<sdd_MediaObject>;
}

interface SddTaxonData {
	taxon: sdd_Taxon;
	mediaObjects: MediaObject[];
}

function stateToSdd(character: Character, state: State):SddStateData {
    return {
        state: {
            id: state.id,
            characterId: character.id ?? "",
            label: state.name.S,
            detail: "",
            mediaObjectsRefs: [],
        },
        mediaObjects: [],
    }
}

function characterToSdd(dataset: Dataset, character: Character, extraFields: Field[], mediaObjects: sdd_MediaObject[]): SddCharacterData {
	const statesData = Array.from(dataset.characterStates(character)).map(s => stateToSdd(character, s));
	const states = statesData.map(data => data.state);
	return {
		character: {
			id: character.id,
			label: character.name.S,
			detail: character.detail,
			parentId: character.parentId,
			states: states,
			inapplicableStatesRefs: character.inapplicableStates.map(s => ({ ref: s.id })),
			childrenIds: character.children.map(c => c.id),
			mediaObjectsRefs: character.pictures.map(pic => ({ ref: pic.id })),
		},
		states: states,
		mediaObjects: statesData.flatMap(data => data.mediaObjects).concat([]),
	};
}

function taxonToSdd(taxon: Taxon, dataset: Dataset): SddTaxonData {
    const sddTaxon: sdd_Taxon = {
        id: taxon.id,
        hid: taxon.id,
		mediaObjectsRefs: taxon.pictures.map(pic => ({ ref: pic.id })),
		label: `${taxon.name.S} / ${taxon.author} / ${taxon.name.CN}`,
		detail: "" + dataset.extraFields.map(function(field) {
			const value = ((field.std) ? taxon : taxon.extra)[field.id];
			if (typeof value === "undefined" || value === null || value == "") {
				return "";
			}
			return `${field.label}: ${value}<br><br>`;
		}).join("") + (taxon.fasc != null) ? 'Flore Madagascar et Comores<br>fasc ${fasc}<br>page ${page}<br><br>' : "" + taxon.detail,
        parentId: taxon.parentId,
        childrenIds: taxon.children.map(t => t.id),
        categoricals: [...dataset.taxonDescriptions(taxon)].map(d => ({
            ref: d.character.id,
            stateRefs: d.states.map(s => ({ ref: s.id }))
        })),
    };
    return {
        taxon: sddTaxon,
        mediaObjects: []
    };
}

export function datasetToSdd(dataset: Dataset): sdd_Dataset {
	const taxons: sdd_Taxon[] = [],
		characters: sdd_Character[] = [];
	let states: sdd_State[] = [],
		mediaObjects: sdd_MediaObject[] = [];

	for (const taxon of dataset.taxons) {
		const sddData = taxonToSdd(taxon, dataset);
		taxons.push(sddData.taxon);
		mediaObjects = mediaObjects.concat(sddData.mediaObjects);
	}
	for (const character of dataset.characters) {
		const sddData = characterToSdd(dataset, character, dataset.extraFields, mediaObjects);
		characters.push(sddData.character);
		states = states.concat(sddData.states);
		mediaObjects = mediaObjects.concat(sddData.mediaObjects);
	}
	return {
		taxons: taxons,
		characters: characters,
		states: states,
		mediaObjects: mediaObjects,
	};
}