import { createHierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";

import { BookInfo, Character, Description, State, Taxon } from "./datatypes";

interface TaxonInit extends Omit<HierarchicalItemInit, "type"> { bookInfoByIds?: Record<string, BookInfo> }

export function createTaxon(init: TaxonInit): Taxon {
	return Object.assign({ bookInfoByIds: init.bookInfoByIds ?? {} },
		createHierarchicalItem<Taxon>({ type: "taxon", ...init }));
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
