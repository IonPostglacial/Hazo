import * as Item from "./Item";
import { defineRef, defineStore, Ref } from "./storeUtils";

export type Node = {
    parent: Node|undefined;
    item: Ref<Item.Item>;
    children: Ref<Node>[];
    addChild(child: Ref<Node>): void;
    forEachNode(callback: (node: Ref<Node>) => void): void;
    forEachLeaves(callback: (node: Ref<Node>) => void): void;
}

export function createStore() {
    const itemStore = Item.createStore();
    const itemRefs = [itemStore.ref];
    const childrenRefs: Ref<Node>[][] = [[]];
    const parentById = new Map<number, Ref<Node>>();

    const Ref: Ref<Node> = defineRef({
        on: {
            swap(ref: Ref<Node>, other: Ref<Node>): void {
                [ref.children, other.children] = [other.children, ref.children];
                ref.item.swap(other.item);
            },
            delete(ref: Ref<Node>): void {
                parentById.delete(hierarchyStore.ids[ref.index]);
                for (const child of ref.children) {
                    child.delete();
                }
                ref.item.delete();
                hierarchyStore.ids[ref.index] = 0;
            },
        },
        methods: {
            index: 0,
            get parent(): Ref<Node>|undefined {
                return parentById.get(hierarchyStore.ids[this.index]);
            },
            set parent(parent: Ref<Node>|undefined) {
                if (typeof parent === "undefined") {
                    parentById.delete(hierarchyStore.ids[this.index]);
                } else {
                    parentById.set(hierarchyStore.ids[this.index], parent);
                }
            },
            get item(): Ref<Item.Item> {
                return itemRefs[this.index];
            },
            get children(): Ref<Node>[] {
                if (this.index > 0 && this.index < childrenRefs.length) {
                    return childrenRefs[this.index]
                        .filter(ref => ref.item.id !== 0)
                        .sort((ref1: Ref<Node>, ref2: Ref<Node>) => ref1.index - ref2.index);
                } else {
                    return [];
                }
            },
            set children(children: Ref<Node>[]) {
                childrenRefs[this.index] = children;
            },
    
            addChild(child: Ref<Node>) {
                const previousParent = parentById.get(child.item.id);
                if (typeof previousParent !== "undefined") {
                    const index = childrenRefs[previousParent.index].findIndex(ref => ref.item.id === child.item.id);
                    if (index >= 0) {
                        childrenRefs[previousParent.index].splice(index, 1);
                    }
                }
                if (!childrenRefs[this.index].map(ref => ref.item.id).includes(child.item.id)) {
                    childrenRefs[this.index].push(child);
                    parentById.set(child.item.id, this);
                }
            },
            forEachNode(callback: (node: Ref<Node>) => void): void {
                callback(this);
                for (const child of this.children) {
                    child.forEachNode(callback);
                }
            },
            forEachLeaves(callback: (node: Ref<Node>) => void): void {
                const children = this.children;
                if (children.length === 0) {
                    callback(this);
                } else {
                    for (const child of children) {
                        child.forEachLeaves(callback);
                    }
                }
            }
        }
    });

    const hierarchyStore = defineStore({
        ref: Ref,
        add(item: Item.Init) {
            childrenRefs.push([]);
            const it = itemStore.add(item);
            itemRefs.push(it);
        },
    });
    return hierarchyStore;
}