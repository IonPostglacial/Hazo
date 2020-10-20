import { createHierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";

import { BookInfo, Character, Description, State, Taxon } from "./datatypes";

interface TaxonInit extends Omit<HierarchicalItemInit, "type"> { statesSelection?: Record<string, boolean>, bookInfoByIds?: Record<string, BookInfo> }

export function createTaxon(init: TaxonInit): Taxon {
	return Object.assign({ statesSelection: init.statesSelection ?? {}, bookInfoByIds: init.bookInfoByIds ?? {} },
		createHierarchicalItem<Taxon>({ type: "taxon", ...init }));
}

function taxonCharacterStates(taxon: Taxon, character: Character): State[] {
	const states: State[] = [];

	for (const [stateId, selected] of Object.entries(taxon.statesSelection)) {
		const state = character.states.find(state => state.id === stateId);
		if (typeof state !== "undefined" && selected) {
			states.push(state);
		}
	}
	return states;
}

export function taxonDescriptions(taxon: Taxon, characters: Iterable<Character>): Description[] {
	const descriptions: Description[] = [];
	
	for (const character of characters) {
		const states = taxonCharacterStates(taxon, character);
		if (states.length > 0) {
			descriptions.push({ character: character, states: states })
		}
	}
	return descriptions;
}
