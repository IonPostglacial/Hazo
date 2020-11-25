import { createHierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";

import { BookInfo, Character, Description, State, Taxon } from "./datatypes";

interface TaxonInit extends Omit<HierarchicalItemInit, "type"> { bookInfoByIds?: Record<string, BookInfo> }

export function createTaxon(init: TaxonInit): Taxon {
	return Object.assign({ bookInfoByIds: init.bookInfoByIds ?? {} },
		createHierarchicalItem<Taxon>({ type: "taxon", ...init }));
}
