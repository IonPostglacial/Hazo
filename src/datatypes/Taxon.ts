import { BookInfo, Hierarchy, HierarchyInit, Picture, Taxon } from "./types";

export type TaxonPropsInit = {
	pictures?: Picture[],
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

export function createTaxon(init: TaxonPropsInit): Taxon {
	return {
		pictures: init.pictures ?? [],
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
	};
}

export type TaxonInit = {
	h: HierarchyInit,
	props: TaxonPropsInit,
	at: number[],
};

export type FullTaxon = {
	h: Hierarchy,
	props: Taxon,
};