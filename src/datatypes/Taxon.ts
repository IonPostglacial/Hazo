import { HierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";

import { BookInfo } from "./datatypes";

interface TaxonInit extends Omit<HierarchicalItemInit, "type"> { bookInfoByIds?: Record<string, BookInfo> }

export class Taxon extends HierarchicalItem<Taxon> {
	bookInfoByIds:Record<string, BookInfo>;
	
	constructor(init: TaxonInit) {
		super({ type: "taxon", ...init });
		this.bookInfoByIds = init.bookInfoByIds ?? {};
	}
}
