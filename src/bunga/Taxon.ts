import { createHierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";

import { BookInfo, Description, Taxon } from "./datatypes";

interface TaxonInit extends HierarchicalItemInit { descriptions: Description[], bookInfoByIds?: Record<string, BookInfo> }

export function createTaxon(init: TaxonInit): Taxon {
	return Object.assign({ descriptions: init.descriptions, bookInfoByIds: init.bookInfoByIds ?? {} },
		createHierarchicalItem<Taxon>(init));
}
