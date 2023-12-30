import { Dataset, HierarchicalItem, Hierarchy, forEachHierarchy } from "@/datatypes";
import { pathToItem } from "@/datatypes/Dataset";


export function fixParentIds(h: Hierarchy<HierarchicalItem>) {
	for (const child of h.children) {
		child.path = pathToItem(h);
		fixParentIds(child);
	}
}

export function fixStatePath(ds: Dataset) {
	forEachHierarchy(ds.charactersHierarchy, ch => {
		if (ch.characterType !== "discrete") { return; }
		for (const state of ch.states) {
			state.path = [...ch.path, ch.id];
		}
	});
}