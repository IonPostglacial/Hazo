import clone from "@/tools/clone";
import { generateId, itemWithIdNotIn, SetLike } from "@/tools/generateid";
import { Hierarchy, HierarchyInit } from "./types";

export function createHierarchy(prefix: string, items: SetLike, init : HierarchyInit): Hierarchy {
	return {
		id: generateId("t", items, init.id),
		children: [],
		name: { S: init.name.S, V: init.name.V ?? "", CN: init.name.CN ?? "", EN: init.name.EN ?? "", FR: init.name.FR ?? "" },
		type: init.type,
		hidden: init.hidden ?? false,
	};
}

export function getIn(h: Hierarchy|undefined, path: number[]): Hierarchy|undefined {
	const [head, ...tail] = path;
	if (typeof tail === "undefined") {
		if (typeof head === "undefined") {
			return h;
		} else {
			return h?.children[head];
		}
	} else if (typeof h === "undefined") {
        return undefined;
    } else {
		return getIn(h.children[head], tail);
	}
}

export function getParent(h: Hierarchy, path: number[]): Hierarchy | undefined {
	if (path.length === 0) return undefined;
	else {
		const parentPath = [...path];
		parentPath.pop();
		return getIn(h, parentPath);
	}
}

export function updateIn(h: Hierarchy, path: number[], cb: ((item: Hierarchy) => Hierarchy)): void {
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

export function removeIn(h: Hierarchy, path: number[]): Hierarchy {
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

export function forEachItem(h: Hierarchy, cb: (item: Hierarchy, path: number[]) => void, path: number[] = []) {
	cb(h, path);
	h.children.forEach((child, i) => forEachItem(child, cb, [...path, i]));
}

export function allItems(h: Hierarchy): Hierarchy[] {
    const items: Hierarchy[] = [];
    forEachItem(h, item => {
        items.push(item);
    });
    return items;
}

export function mapHierarchy(cb: (item: Hierarchy) => Hierarchy) {
	return function onEachItem(h: Hierarchy): Hierarchy {
		const item = cb(h);
		item.children = item.children.map(onEachItem)
		return item;
	};
}

export function filterHierarchy(cb: (item: Hierarchy) => boolean) {
	return function onEachItem(h: Hierarchy): Hierarchy {
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

export function mergeIn(h: Hierarchy, items: SetLike, path: number[], other: Hierarchy) {
	getIn(h, path)?.children.push(mapHierarchy(itemWithIdNotIn(items))(other));
}

export function moveUp(h: Hierarchy, path: number[]) {
	const prevIndex = path[path.length - 1];
	if (prevIndex > 0) {
		const parent = getParent(h, path);
		const newIndex = prevIndex - 1;
		if (typeof parent !== "undefined") {
			const tmp = parent.children[newIndex];
			parent.children[newIndex] = parent.children[prevIndex];
			parent.children[prevIndex] = tmp;
		}
	}
}

export function moveDown(h: Hierarchy, path: number[]) {
	const prevIndex = path[path.length - 1];
	const parent = getParent(h, path);
	if (typeof parent !== "undefined") {
		if (prevIndex < parent.children.length - 1) {
			const newIndex = prevIndex + 1;
			if (typeof parent !== "undefined") {
				const tmp = parent.children[newIndex];
				parent.children[newIndex] = parent.children[prevIndex];
				parent.children[prevIndex] = tmp;
			}
		}
	}
}