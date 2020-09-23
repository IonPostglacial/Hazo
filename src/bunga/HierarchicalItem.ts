import { HierarchicalItem } from "./datatypes";
import { createDetailData, DetailDataInit } from "./DetailData";

export interface HierarchicalItemInit extends DetailDataInit { type: string, parentId: string|undefined, childrenIds: readonly string[] }

export function createHierarchicalItem<T>(init : HierarchicalItemInit): HierarchicalItem<T> {
	return Object.assign({
		type: init.type,
		parentId: init.parentId,
		topLevel: typeof init.parentId === "undefined",
		hidden: false,
		children: {},
		childrenOrder: init.childrenIds.slice(),
	}, createDetailData(init));
}

export function repairPotentialCorruption(item: HierarchicalItem<any>) {
	item.topLevel = typeof item.parentId === "undefined";
	const childrenOrder = new Set<any>();

	// Ensure each children has an order
	for (const childId of item.childrenOrder) {
		if (typeof item.children[childId] !== "undefined") {
			childrenOrder.add(childId);
		}
	}
	for (const childId of Object.keys(item.children)) {
		if (!childrenOrder.has(childId)) {
			childrenOrder.add(childId);
		}
	}
	item.childrenOrder = [...childrenOrder];
}

export function hydrateChildren<T extends HierarchicalItem<T>>(item: HierarchicalItem<T>, hierarchyById: Record<string, T>) {
	for (const id of item.childrenOrder) {
		const child = hierarchyById[id];
		if (typeof child === "undefined" || child == null) {
			console.log(`Child not found: ${name} > ${id}`);
		} else if (!id) {
			console.log(`Child with no id: ${child.name}`);
		}else {
			item.children[id] = hierarchyById[id];
		}
	}
}