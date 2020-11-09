import { DetailData, Picture } from "./datatypes";
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

export function createDetailData(init: DetailDataInit): DetailData {
	return {
		id: init.id,
		name: init.name ?? "",
		author: init.author ?? "",
		nameEN: init.nameEN ?? "",
		nameCN: init.nameCN ?? "",
		name2: init.name2 ?? "",
		vernacularName: init.vernacularName ?? "",
		vernacularName2: init.vernacularName2 ?? "",
		meaning: init.meaning ?? "",
		herbariumPicture: init.herbariumPicture ?? "",
		website: init.website ?? "",
		noHerbier: init.noHerbier,
		fasc: init.fasc,
		page: init.page,
		detail: init.detail ?? "",
		photos: picturesFromPhotos(init.photos ?? []),
		extra: init.extra ?? {},
	}
}
