import { Hierarchy } from "./hierarchy";
import { HierarchicalItem, AnyHierarchicalItem, MultilangText, Picture } from "./types";

export interface HierarchicalItemInit {
	parentId?: string;
	id?: string,
	type: "character" | "taxon",
	name: MultilangText;
	detail?: string,
	pictures?: Picture[];
	hidden?: boolean;
}

export function createHierarchicalItem(init : HierarchicalItemInit): Hierarchy<AnyHierarchicalItem> & { detail: string } {
	return {
		parentId: init.parentId,
		id: init.id ?? "",
		type: init.type,
		detail: init.detail ?? "",
		children: [],
		name: { S: init.name.S, V: init.name.V ?? "", CN: init.name.CN ?? "", EN: init.name.EN ?? "", FR: init.name.FR ?? "" },
		pictures: init.pictures ?? [],
		hidden: init.hidden ?? false,
	};
}

export function isTopLevel(item: HierarchicalItem): boolean {
	return typeof item.parentId === "undefined";
}