import { HierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";

import { BookInfo } from "./types";

interface TaxonInit extends Omit<HierarchicalItemInit, "type"> {
	bookInfoByIds?: Record<string, BookInfo>
	specimentLocations?: { lat: number, lng: number }[];
}

export class Taxon extends HierarchicalItem<Taxon> {
	bookInfoByIds:Record<string, BookInfo>;
	specimenLocations: { lat: number, lng: number }[];
	
	constructor(init: TaxonInit) {
		super({ type: "taxon", ...init });
		this.bookInfoByIds = init.bookInfoByIds ?? {};
		this.specimenLocations = init.specimentLocations ?? [];
	}
}
