import { Hierarchy } from "./hierarchy";
import { AnyHierarchicalItem, MultilangText, Picture, AnyItem } from "./types";

export interface HierarchicalItemInit {
	id?: string,
	path: string[],
	type: "character" | "taxon",
	name: MultilangText;
	detail?: string,
	pictures?: Picture[];
	hidden?: boolean;
}

export function createHierarchicalItem(init : HierarchicalItemInit): Hierarchy<AnyHierarchicalItem> & { detail: string } {
	return {
		id: init.id ?? "",
		path: init.path,
		type: init.type,
		detail: init.detail ?? "",
		children: [],
		name: { S: init.name.S, V: init.name.V ?? "", CN: init.name.CN ?? "", EN: init.name.EN ?? "", FR: init.name.FR ?? "" },
		pictures: init.pictures ?? [],
		hidden: init.hidden ?? false,
	};
}

export function isTopLevel(item: AnyItem): boolean {
	return item.path.length === 0;
}