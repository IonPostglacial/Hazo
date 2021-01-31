import * as Item from "./Item";
import { defineStore, Ref } from "./storeUtils";

export type Node = {
    parent: Node|undefined;
    item: Ref<Item.Item>;
    children: NodeRef[];
}

export type NodeRef = Ref<Node> & {
    addChild(child: NodeRef): void;
    forEachNode(callback: (node: NodeRef) => void): void;
    forEachLeaves(callback: (node: NodeRef) => void): void;
}

export function createStore() {
    const store = Item.createStore();
    const childrenRefs: NodeRef[][] = [[]];
    const parentById = new Map<number, Ref<Node>>();

    const Ref: NodeRef = {
        index: 0,

        get parent(): Ref<Node>|undefined {
            return parentById.get(store.ids[this.index]);
        },
        set parent(parent: Ref<Node>|undefined) {
            if (typeof parent === "undefined") {
                parentById.delete(store.ids[this.index]);
            } else {
                parentById.set(store.ids[this.index], parent);
            }
        },
        get item(): Ref<Item.Item> {
            return store.getById(store.ids[this.index]);
        },
        get children(): NodeRef[] {
            if (this.index > 0 && this.index < childrenRefs.length) {
                return childrenRefs[this.index]
                    .filter(ref => ref.item.id !== 0)
                    .sort((ref1: Ref<Node>, ref2: Ref<Node>) => ref1.index - ref2.index);
            } else {
                return [];
            }
        },
        set children(children: NodeRef[]) {
            childrenRefs[this.index] = children;
        },
        swap(ref: Ref<Node>): void {
            const tmpChildren = childrenRefs[this.index];
            childrenRefs[this.index] = childrenRefs[ref.index];
            childrenRefs[ref.index] = tmpChildren;
            this.item.swap(ref.item);
            hierarchyStore.swapRefs(this.index, ref.index);
        },
        delete(): void {
            if (store.ids[this.index] !== 0) {
                parentById.delete(store.ids[this.index]);
                for (const child of this.children) {
                    child.delete();
                }
                this.item.delete();
                hierarchyStore.deleteRef(this);
            }
        },
        clone(): Ref<Node> {
            return hierarchyStore.makeRef(this.index);
        },
        addChild(child: NodeRef) {
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
        forEachNode(callback: (node: NodeRef) => void): void {
            callback(this);
            for (const child of this.children) {
                child.forEachNode(callback);
            }
        },
        forEachLeaves(callback: (node: NodeRef) => void): void {
            const children = this.children;
            if (children.length === 0) {
                callback(this);
            } else {
                for (const child of children) {
                    child.forEachLeaves(callback);
                }
            }
        }
    };

    const hierarchyStore = defineStore({
        ids: store.ids,
        ref: Ref,
        add(item: Item.Init): number {
            childrenRefs.push([]);
            return store.add(item);
        },
    });
    return hierarchyStore;
}