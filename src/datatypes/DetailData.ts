import { BasicInfo, Picture } from "./types";
import { picturesFromPhotos } from './picture';

export interface DetailDataInit {
	id: string;
	name?: string;
	author?: string;
	nameEN?: string;
	nameCN?: string;
	name2?: string;
	vernacularName?: string;
	vernacularName2?: string;
	meaning?: string;
	herbariumPicture?: string;
	website?: string;
	noHerbier?: number;
	fasc?: number;
	page?: number;
	detail?: string;
	photos?: Picture[]|string[];
	extra?: Record<string, any>;
}

export class DetailData implements BasicInfo {
	id: string;
	name: string;
	nameEN: string;
	nameCN: string;
	photos: Picture[];
	author: string;
	vernacularName: string;
	vernacularName2: string;
	name2: string;
	meaning: string;
	herbariumPicture: string;
	website: string;
	noHerbier: number|undefined;
	fasc: number|undefined;
	page: number|undefined;
	detail : string;
	extra: Record<string, any>;

	constructor(init: DetailDataInit) {
		this.id = init.id;
		this.name = init.name ?? "";
		this.author = init.author ?? "";
		this.nameEN = init.nameEN ?? "";
		this.nameCN = init.nameCN ?? "";
		this.name2 = init.name2 ?? "";
		this.vernacularName = init.vernacularName ?? "";
		this.vernacularName2 = init.vernacularName2 ?? "";
		this.meaning = init.meaning ?? "";
		this.herbariumPicture = init.herbariumPicture ?? "";
		this.website = init.website ?? "";
		this.noHerbier = init.noHerbier;
		this.fasc = init.fasc;
		this.page = init.page;
		this.detail = init.detail ?? "";
		this.photos = picturesFromPhotos(init.photos ?? []);
		this.extra = init.extra ?? {};
	}
}
