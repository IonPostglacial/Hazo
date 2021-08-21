import clone from "@/tools/clone";
import { generateId, itemWithIdNotIn, SetLike } from "@/tools/generateid";
import { HierarchicalItem, HierarchicalItemInit, MultilangText, Picture } from "./types";

export function createHierarchicalItem(prefix: string, items: { has(key: string): boolean, size: number }, init : HierarchicalItemInit): HierarchicalItem {
	return {
		id: generateId("t", items, init.id),
		children: [],
		name: { S: init.name.S, V: init.name.V ?? "", CN: init.name.CN ?? "", EN: init.name.EN ?? "", FR: init.name.FR ?? "" },
		type: init.type,
		hidden: init.hidden ?? false,
	};
}

export function getIn(h: HierarchicalItem, path: number[]): HierarchicalItem {
	const [head, ...tail] = path;
	if (typeof tail === "undefined") {
		if (typeof head === "undefined") {
			return h;
		} else {
			return h.children[head];
		}
	} else {
		return getIn(h.children[head], tail);
	}
}

export function getParent(h: HierarchicalItem, path: number[]): HierarchicalItem | undefined {
	if (path.length === 0) return undefined;
	else {
		const parentPath = [...path];
		parentPath.pop();
		return getIn(h, parentPath);
	}
}

export function updateIn(h: HierarchicalItem, path: number[], cb: ((item: HierarchicalItem) => HierarchicalItem)): void {
	const [head, ...tail] = path;
	if (typeof tail === "undefined") {
		if (typeof head === "undefined") {
			throw "updateIn takes a list with at least one element";
		} else {
			h.children[head] = cb(h.children[head]);
		}
	} else {
		return updateIn(h.children[head], tail, cb);
	}
}

export function removeIn(h: HierarchicalItem, path: number[]): HierarchicalItem {
	const [head, ...tail] = path;
	if (typeof tail === "undefined") {
		if (typeof head === "undefined") {
			throw "popIn takes a list with at least one element";
		} else {
			const result = h.children[head];
			h.children.splice(head, 1);
			return result;
		}
	} else {
		return removeIn(h.children[head], tail);
	}
}

export function forEachItem(h: HierarchicalItem, cb: (item: HierarchicalItem) => void) {
	cb(h);
	h.children.forEach(child => forEachItem(child, cb));
}

export function mapHierarchy(cb: (item: HierarchicalItem) => HierarchicalItem) {
	return function onEachItem(h: HierarchicalItem): HierarchicalItem {
		const item = cb(h);
		item.children = item.children.map(onEachItem)
		return item;
	};
}

export function filterHierarchy(cb: (item: HierarchicalItem) => boolean) {
	return function onEachItem(h: HierarchicalItem): HierarchicalItem {
		const item = clone(h);
		item.children = [];
		for (const child of h.children) {
			if (cb(h)) {
				item.children.push(filterHierarchy(cb)(child))
			}
		}
		return item;
	};
}

export function mergeIn(h: HierarchicalItem, items: SetLike, path: number[], other: HierarchicalItem) {
	getIn(h, path).children.push(mapHierarchy(itemWithIdNotIn(items))(other));
}