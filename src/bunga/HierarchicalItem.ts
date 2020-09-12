import { HierarchicalItem } from "./datatypes";
import { createDetailData, DetailDataInit } from "./DetailData";

export interface HierarchicalItemInit extends DetailDataInit { type: string, parentId: string|undefined, childrenIds: readonly string[] }

export function createHierarchicalItem<T>(init : HierarchicalItemInit): HierarchicalItem<T> {
	return Object.assign({
		type: init.type,
		parentId: init.parentId,
		topLevel: !init.parentId,
		hidden: false,
		children: {},
		_childrenIds: init.childrenIds.slice(),
	}, createDetailData(init));
}

export function hydrateChildren<T>(item: HierarchicalItem<T>, hierarchyById: Record<string, T>) {
	for (const id of item._childrenIds) {
		const child = hierarchyById[id];
		if (typeof child === "undefined" || child == null) {
			console.log('Child not found: $name > $id');
		} else {
			item.children[id] = hierarchyById[id];
		}
	}
}
