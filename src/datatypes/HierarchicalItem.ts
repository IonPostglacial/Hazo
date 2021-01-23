import { DetailData, DetailDataInit } from "./DetailData";

export interface HierarchicalItemInit extends DetailDataInit { type: string, parentId: string|undefined }

export class HierarchicalItem<T> extends DetailData {
    type: string;
	parentId: string|undefined;
	hidden: boolean;
	childrenOrder: string[];

	constructor(init : HierarchicalItemInit) {
		super(init);
		this.type = init.type;
		this.parentId = init.parentId;
		this.hidden = false;
		this.childrenOrder = [];
	}

	get topLevel(): boolean {
		return typeof this.parentId === "undefined";
	}

	reorderChildren(childrenIds: string[]) {
		const oldOrder = this.childrenOrder;
		this.childrenOrder = [];
		for (const id of childrenIds) {
			const oldIdIndex = oldOrder.indexOf(id);
			if (oldIdIndex >= 0) {
				this.childrenOrder.push(id);
				oldOrder.splice(oldIdIndex, 1);
			}
		}
		for (const id of oldOrder) {
			this.childrenOrder.push(id);
		}
	}
}