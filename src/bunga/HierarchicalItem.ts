import { DetailData, DetailDataInit } from "./DetailData";
import { picturesFromPhotos } from './picture';

export interface HierarchicalItemInit extends DetailDataInit { type: string, parentId: string|undefined, childrenIds: readonly string[] }

export class HierarchicalItem<T> extends DetailData {
    type: string;
	parentId: string|undefined;
	topLevel: boolean;
	hidden: boolean;
	childrenOrder: string[]|undefined;

	constructor(init : HierarchicalItemInit) {
		super(init);
		this.type = init.type;
		this.parentId = init.parentId;
		this.topLevel = typeof init.parentId === "undefined";
		this.hidden = false;
		const childrenOrder = new Set<any>();
	
		// Ensure each children has an order
		for (const childId of init.childrenIds ?? []) {
			childrenOrder.add(childId);
		}
		this.childrenOrder = [...childrenOrder];
	}
}