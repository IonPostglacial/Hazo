import { DetailData, DetailDataInit } from "./DetailData";

export interface HierarchicalItemInit extends DetailDataInit { type: string, parentId: string|undefined, childrenIds: readonly string[] }

export class HierarchicalItem extends DetailData {
	type: string;
	parentId: string|undefined;
	topLevel: boolean;
	hidden = false;
	children: Record<string, HierarchicalItem>;
	#childrenIds: string[];

	hydrateChildren(hierarchyById: Record<string, HierarchicalItem>) {
		for (const id of this.#childrenIds) {
			const child = hierarchyById[id];
			if (typeof child === "undefined" || child == null) {
				console.log('Child not found: $name > $id');
			} else {
				this.children[id] = hierarchyById[id];
			}
		}
	}

	get childrenIds(): readonly string[] {
		return this.#childrenIds;
	}

	constructor(init : HierarchicalItemInit) {
		super(init);
		this.type = init.type;
		this.parentId = init.parentId;
		this.topLevel = !init.parentId;
		this.children = {};
		this.#childrenIds = init.childrenIds.slice();
	}
}
