import { multilangTextEquals } from "@/tools/multilangtextequal";
import { createHierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";
import { BookInfo, Measurement, State, Taxon } from "./types";
import { pathToItem } from "./Dataset";

interface TaxonInit extends Omit<HierarchicalItemInit, "type"> {
	bookInfoByIds?: Record<string, BookInfo>
	specimenLocations?: { lat: number, lng: number }[];
	author?: string;
	name2?: string;
	vernacularName2?: string;
	measurements?: Partial<Record<string, Measurement>>;
	meaning?: string;
	herbariumPicture?: string;
	website?: string;
	noHerbier?: string;
	fasc?: string;
	page?: string;
	detail?: string;
	extra?: Record<string, any>;
}

export function createTaxon(init: TaxonInit): Taxon {
	const t: Taxon = {
		...createHierarchicalItem({ ...init, type: "taxon" }),
		type: "taxon",
		states: [],
		measurements: init.measurements ?? {},
		bookInfoByIds: init.bookInfoByIds ?? {},
		specimenLocations: init.specimenLocations ?? [],
		author: init.author ?? "",
		name2: init.name2 ?? "",
		vernacularName2: init.vernacularName2 ?? "",
		meaning: init.meaning ?? "",
		herbariumPicture: init.herbariumPicture ?? "",
		website: init.website ?? "",
		noHerbier: init.noHerbier,
		fasc: init.fasc ?? "",
		page: init.page ?? "",
		detail: init.detail ?? "",
		extra: init.extra ?? {},
		children: [],
	};
	if (t.bookInfoByIds) {
		for (const bi of Object.values(t.bookInfoByIds)) {
			bi.path = pathToItem(t);
		}
	};
	return t;
}

export function taxonPropertiesEquals(taxon: Taxon, other: Taxon): boolean {
	return multilangTextEquals(taxon.name, other.name) &&
		taxon.author === other.author &&
		taxon.name2 === other.name2 &&
		taxon.vernacularName2 === other.vernacularName2 &&
		taxon.website === other.website &&
		taxon.noHerbier === other.noHerbier &&
		taxon.herbariumPicture === other.herbariumPicture &&
		taxon.detail === other.detail &&
		taxon.page === other.page &&
		taxon.fasc === other.fasc &&
		taxon.meaning === other.meaning &&
		((
			typeof taxon.bookInfoByIds === "undefined" &&
			typeof other.bookInfoByIds === taxon.bookInfoByIds
		 ) ||
			Object.entries(taxon.bookInfoByIds ?? {})
				.every(([id, bookInfo]) => {
					const otherBookInfo = (other.bookInfoByIds ?? {})[id];
					return bookInfo.fasc === otherBookInfo.fasc &&
						bookInfo.page === otherBookInfo.page &&
						bookInfo.detail === otherBookInfo.detail;
				}));
}

export function taxonHasState(taxon: Taxon, state: State) {
	return taxon.states.some(s => s.id === state.id);
}

export function taxonHasStates(taxon: Taxon, states: State[]): boolean {
	return states.every(s => taxonHasState(taxon, s));
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