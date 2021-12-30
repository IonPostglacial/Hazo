import { createHierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";
import { BookInfo, State, Taxon } from "./types";

interface TaxonInit extends Omit<HierarchicalItemInit, "type"> {
	bookInfoByIds?: Record<string, BookInfo>
	specimenLocations?: { lat: number, lng: number }[];
	author?: string;
	name2?: string;
	vernacularName2?: string;
	meaning?: string;
	herbariumPicture?: string;
	website?: string;
	noHerbier?: number;
	fasc?: number;
	page?: number;
	detail?: string;
	extra?: Record<string, any>;
}

export function createTaxon(init: TaxonInit): Taxon {
	return {
		...createHierarchicalItem({ type: "taxon", ...init }),
		states: [],
		bookInfoByIds: init.bookInfoByIds ?? {},
		specimenLocations: init.specimenLocations ?? [],
		author: init.author ?? "",
		name2: init.name2 ?? "",
		vernacularName2: init.vernacularName2 ?? "",
		meaning: init.meaning ?? "",
		herbariumPicture: init.herbariumPicture ?? "",
		website: init.website ?? "",
		noHerbier: init.noHerbier,
		fasc: init.fasc,
		page: init.page,
		detail: init.detail ?? "",
		extra: init.extra ?? {},
		children: [],
	};
}

export function taxonHasStates(taxon: Taxon, states: State[]): boolean {
	return states.every(s => taxon.states.some(state => state.id === s.id));
}

export function taxonOrAnyChildHasStates(taxon: Taxon, states: State[]): boolean {
	if (taxonHasStates(taxon, states)) {
		return true;
	} else {
		for (const child of taxon.children) {
			if (taxonOrAnyChildHasStates(child, states)) {
				return true;
			}
		}
	}
	return false;
}