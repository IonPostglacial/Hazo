import { Item } from "./Item";

export function createHierarchyStore() {
    const childrenRefs: Item.Ref[][] = [];
    const parentById = new Map<number, Item.Ref>();

    return {
        itemAdded(item: Item.Ref): void {
            childrenRefs.push([]);
        },
        itemsSwapped(item1: Item.Ref, item2: Item.Ref): void {
            const tmp = childrenRefs[item1.index];
            childrenRefs[item1.index] = childrenRefs[item2.index];
            childrenRefs[item2.index] = tmp;
        },
        itemDeleted(item: Item.Ref): void {
            parentById.delete(item.id);
            for (const child of childrenRefs[item.index]) {
                child.delete();
            }
            childrenRefs[item.index] = [];
        },
        addChild(item: Item.Ref, child: Item.Ref) {
            const previousParent = parentById.get(child.id);
            if (typeof previousParent !== "undefined") {
                const index = childrenRefs[previousParent.index].findIndex(ref => ref.id === child.id);
                if (index >= 0) {
                    childrenRefs[previousParent.index].splice(index, 1);
                }
            }
            if (!childrenRefs[item.index].map(ref => ref.id).includes(child.id)) {
                childrenRefs[item.index].push(child);
                parentById.set(child.id, item);
            }
        },
        parentOf(item: Item.Ref): Item.Ref|undefined {
            return parentById.get(item.id);
        },
        childrenOf(item: Item.Ref): Item.Ref[] {
            if (item.index > 0 && item.index < childrenRefs.length) {
                return childrenRefs[item.index]
                    .filter(ref => ref.id !== 0)
                    .sort((a, b) => a.index - b.index);
            } else {
                return [];
            }
        },
    };
}