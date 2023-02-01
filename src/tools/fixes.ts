import { HierarchicalItem, Hierarchy } from "@/datatypes";


export function fixParentIds(h: Hierarchy<HierarchicalItem>) {
	for (const child of h.children) {
		child.parentId = h.id;
		fixParentIds(child);
	}
}