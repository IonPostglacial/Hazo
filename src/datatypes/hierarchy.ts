import { HierarchicalItem } from "./HierarchicalItem";
import clone from "../tools/clone";

export interface IMap<T> {
    get(key: string): T|undefined;
    has(key: string): boolean;
    set(key: string, value: T): void;
    delete(key: string): void;
    [Symbol.iterator](): Iterator<[string, T]>;
    keys(): Iterable<string>;
    values(): Iterable<T>;
    clear(): void;
    entries(): Iterable<[string, T]>;
}

export class Hierarchy<T extends HierarchicalItem<T>> {
    private idPrefix: string;
    private items: IMap<T>;
    private itemsOrder: string[];

    constructor(idPrefix: string, items: IMap<T>, itemsOrder: string[]|undefined = undefined) {
        this.idPrefix = idPrefix;
        this.items = items;
        if (typeof itemsOrder === "undefined") {
            this.itemsOrder = [];
            for (const item of items.values()) {
                if (item.topLevel) {
                    this.itemsOrder.push(item.id);
                }
            }
        } else {
            this.itemsOrder = itemsOrder;
        }
    }

    get allItems(): Iterable<T> {
        const self = this;
        return {
            *[Symbol.iterator]() {
                for (const item of self.topLevelItems) {
                    yield* self.getOrderedChildrenTree(item);
                }
            }
        }
    }

    get topLevelItems(): Iterable<T> {
        const items = this.items, itemsOrders = this.itemsOrder;
        return {
            *[Symbol.iterator]() {
                for (let i = 0; i < itemsOrders.length; i++) {
                    yield items.get(itemsOrders[i]) as T; // It should never be undefined
                }
            }
        }
    }

    add(item: T): T {
        let newId = item.id;
        const isNewEntry = !this.itemsOrder.includes(newId);
        if (item.id === "") {
            let nextId = this.itemsOrder.length;
            while (this.items.has(this.idPrefix + nextId)) {
                nextId++;
            }
            newId = this.idPrefix + nextId;
        }
        const newItem = Object.assign(item, { id: newId }) as T;
        this.items.set(newId, newItem);

        if (typeof newItem.parentId === "undefined") {
            if (isNewEntry) {
                this.itemsOrder.push(newId);
            }
        } else {
            const parent = this.items.get(newItem.parentId);
            if (typeof parent !== "undefined") {
                if(typeof parent.childrenOrder === "undefined") {
                    parent.childrenOrder = [newId];
                } else {
                    const order = parent.childrenOrder.indexOf(newId);
                    if (order === -1) {
                        parent.childrenOrder.push(newId);
                    }
                }
            }
        }
        return newItem;
    }

    itemWithId(id: string|undefined): T|undefined {
        if (typeof id === "undefined") return undefined;
        return this.items.get(id);
    }

    hasChildren(item: T|undefined): boolean {
        return typeof item?.childrenOrder !== "undefined" && item.childrenOrder.length > 0;
    }

    childrenOf(item: T|undefined): Iterable<T> {
        if (typeof item === "undefined") return [];
        const self = this;
        return {
            *[Symbol.iterator]() {
                for (const childId of item.childrenOrder ?? []) {
                    const child = self.items.get(childId);
                    if (typeof child !== "undefined") {
                        yield child;
                    }
                }
            }
        }
    }

    protected cloneNewItem(item: T): T {
        const newItem = clone(item);
        newItem.id = "";
        newItem.childrenOrder = [];

        return newItem;
    }

    extractHierarchy(item: T, hierarchy: Hierarchy<T>|null = null, parentId: string|undefined = undefined): Hierarchy<T> {
        if (hierarchy === null) hierarchy = new (Object.getPrototypeOf(this).constructor as any)(this.idPrefix, new Map<string, T>());

        const newItem = this.cloneNewItem(item);
        newItem.parentId = parentId;
        hierarchy!.add(newItem);
        hierarchy!.onCloneFrom(this, item, newItem);

        for (const child of this.childrenOf(item)) {
            this.extractHierarchy(child, hierarchy, newItem.id);
        }
        return hierarchy!;
    }

    protected onCloneFrom(hierarchy: Hierarchy<T>, item: T, clone: T) {}

    addHierarchy(hierarchy: Hierarchy<T>, targetId: string|undefined): void {
        for (const oldItem of [...hierarchy.allItems]) {
            const item = clone(oldItem);
            if (typeof item.parentId === "undefined") item.parentId = targetId;
            const children = [...hierarchy.childrenOf(oldItem)];
            item.id = "";
            item.childrenOrder = [];
            this.add(item);
            this.onCloneFrom(hierarchy, oldItem, item);
            for (const child of children) {
                child.parentId = item.id;
            }
        }
    }

    parentsOf(item: T|undefined): T[] {
        if (typeof item === "undefined") return [];
        const hierarchy: T[] = [];
        let it: T|undefined = item;

        while(typeof it?.parentId !== "undefined") {
            const parent = this.itemWithId(it.parentId);
            hierarchy.unshift(parent!);
            it = parent;
        }
        return hierarchy;
    }

    getOrderedChildrenTree(item: T|undefined): Iterable<T> {
        if (typeof item === "undefined") return [];
        const self = this;
        return {
            *[Symbol.iterator]() {
                yield item;
                for (const child of self.childrenOf(item)) {
                    yield* self.getOrderedChildrenTree(child);
                }
            }
        }
    }

    getLeaves(item: T|undefined): Iterable<T> {
        if (typeof item === "undefined") return [];
        const self = this;
        return {
            *[Symbol.iterator]() {
                if (!self.hasChildren(item)) {
                    yield item;
                } else {
                    for (const child of self.childrenOf(item)) {
                        yield* self.getLeaves(child);
                    }
                }
            }
        }
    }

    remove(item: T): void {
        if (typeof item.childrenOrder !== "undefined") {
            for (const childId of item.childrenOrder) {
                const child = this.itemWithId(childId);
                if (typeof child !== "undefined") {
                    this.remove(child);
                }
            }
        }
        this.items.delete(item.id);
        const order = this.itemsOrder.indexOf(item.id);
        if (order >= 0) {
            this.itemsOrder.splice(order, 1);
        }
        if (typeof item.parentId !== "undefined") {
            const parent = this.items.get(item.parentId);
            if (typeof parent === "undefined") {
                console.error(`Trying to remove an item with a parent that doesn't exist: ${item.parentId}`);
            } else {
                if (typeof parent.childrenOrder === "undefined") return;
                const childOrder = parent.childrenOrder.indexOf(item.id);
                parent.childrenOrder.splice(childOrder, 1);
            }
        }
    }

    moveUp(item: T): void {
        let orders: Array<string>;
        if (typeof item.parentId === "undefined") {
            orders = this.itemsOrder
        } else {
            orders = this.items.get(item.parentId)?.childrenOrder ?? [];
        }
        const order = orders.indexOf(item.id);
        if (order > 0) {
            const tmp = orders[order - 1];
            orders[order - 1] = orders[order];
            orders[order] = tmp;
        }
        this.add({...item});
    }

    moveDown(item: T): void {
        let orders: Array<string>;
        if (typeof item.parentId === "undefined") {
            orders = this.itemsOrder
        } else {
            orders = this.items.get(item.parentId)?.childrenOrder ?? [];
        }
        const order = orders.indexOf(item.id);
        if (order < orders.length - 1) {
            const tmp = orders[order + 1];
            orders[order + 1] = orders[order];
            orders[order] = tmp;
        }
        this.add({...item});
    }

    clear() {
        this.items.clear();
        this.itemsOrder = [];
    }

    clone(): Hierarchy<T> {
        return new Hierarchy<T>(this.idPrefix, clone(this.items), this.itemsOrder.slice());
    }

    toObject(): any {
        return Object.fromEntries(this.items.entries());
    }
}