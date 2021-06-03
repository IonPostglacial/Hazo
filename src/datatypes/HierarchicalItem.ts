import { DetailData, DetailDataInit } from "./DetailData";

export interface HierarchicalItemInit extends DetailDataInit { type: string, parentId: string|undefined }

export class HierarchicalItem<T> extends DetailData {
    type: string;
	parentId: string|undefined;
	hidden: boolean;

	constructor(init : HierarchicalItemInit) {
		super(init);
		this.type = init.type;
		this.parentId = init.parentId;
		this.hidden = false;
	}

	get topLevel(): boolean {
		return typeof this.parentId === "undefined";
	}
}