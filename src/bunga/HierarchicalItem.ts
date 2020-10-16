import { HierarchicalItem } from "./datatypes";
import { createDetailData, DetailDataInit } from "./DetailData";
import { picturesFromPhotos } from './picture';

export interface HierarchicalItemInit extends DetailDataInit { type: string, parentId: string|undefined, childrenIds: readonly string[] }

export function createHierarchicalItem<T>(init : HierarchicalItemInit): HierarchicalItem<T> {
	return Object.assign({
		type: init.type,
		parentId: init.parentId,
		topLevel: typeof init.parentId === "undefined",
		hidden: false,
		childrenOrder: init.childrenIds.slice(),
	}, createDetailData(init));
}

export function repairPotentialCorruption(item: HierarchicalItem<any>) {
	item.topLevel = typeof item.parentId === "undefined";
	item.photos = picturesFromPhotos(item.photos);
	const childrenOrder = new Set<any>();

	// Ensure each children has an order
	for (const childId of item.childrenOrder ?? []) {
		childrenOrder.add(childId);
	}
	item.childrenOrder = [...childrenOrder];
}