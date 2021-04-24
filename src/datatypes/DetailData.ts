import { BasicInfo, MultilangText, Picture } from "./types";
import { picturesFromPhotos } from './picture';

export interface DetailDataInit {
	id: string;
	name?: MultilangText;
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
	pictures?: Picture[]|string[];
	extra?: Record<string, any>;
}

export class DetailData implements BasicInfo {
	id: string;
	name: MultilangText;
	pictures: Picture[];
	author: string;
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
		this.name = init.name ?? { S: "", V: "" };
		this.author = init.author ?? "";
		this.name2 = init.name2 ?? "";
		this.vernacularName2 = init.vernacularName2 ?? "";
		this.meaning = init.meaning ?? "";
		this.herbariumPicture = init.herbariumPicture ?? "";
		this.website = init.website ?? "";
		this.noHerbier = init.noHerbier;
		this.fasc = init.fasc;
		this.page = init.page;
		this.detail = init.detail ?? "";
		this.pictures = picturesFromPhotos(init.pictures ?? []);
		this.extra = init.extra ?? {};
	}
}
