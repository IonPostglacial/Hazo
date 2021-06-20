import { HierarchicalItem, MultilangText, Picture } from "./types";

export interface HierarchicalItemInit {
	parentId?: string;
	id?: string,
	name: MultilangText;
	pictures?: Picture[];
	type: string;
	hidden?: boolean;
}

export function createHierarchicalItem(init : HierarchicalItemInit): HierarchicalItem {
	return {
		parentId: init.parentId,
		id: init.id ?? "",
		name: { S: init.name.S, V: init.name.V ?? "", CN: init.name.CN ?? "", EN: init.name.EN ?? "", FR: init.name.FR ?? "" },
		pictures: init.pictures ?? [],
		type: init.type,
		hidden: init.hidden ?? false,
	};
}

export function isTopLevel(item: HierarchicalItem): boolean {
	return typeof item.parentId === "undefined";
}