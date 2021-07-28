import { HierarchicalItem } from "./types";
import clone from "../tools/clone";

export interface IMap<T> {
    get(key: string): T|undefined;
    has(key: string): boolean;
    set(key: string, value: T): void;
    delete(key: string): void;
    size: number;
    [Symbol.iterator](): Iterator<[string, T]>;
    keys(): Iterable<string>;
    values(): Iterable<T>;
    clear(): void;
    entries(): Iterable<[string, T]>;
}

export class Hierarchy<T extends HierarchicalItem> {
    private idPrefix: string;
    private items: IMap<T>;
    private ordersByItemIds: IMap<string[]>;
    private count: number;
    private onAddCallbacks = new Set<(item: T, autoid: boolean) => void>();
    private onRemoveCallbacks = new Set<(item: T) => void>();
    private onClearCallbacks = new Set<() => void>();
    private onCloneCallbacks = new Set<(hierarchy: Hierarchy<T>, item: T, clone: T, newParent: T|undefined) => void>();

    constructor(idPrefix: string, items: IMap<T>) {
        this.idPrefix = idPrefix;
        this.items = items;
        this.count = 0;
        this.ordersByItemIds = new (Object.getPrototypeOf(items).constructor)();
        for (const item of items.values()) {
            this.add(item);
        }
    }

    onAdd(callback: (item: T, autoid: boolean) => void) {
       this.onAddCallbacks.add(callback); 
    }

    onRemove(callback: (item: T) => void) {
        this.onRemoveCallbacks.add(callback); 
    }

    onClone(callback: (hierarchy: Hierarchy<T>, item: T, clone: T, newParent: T|undefined) => void) {
        this.onCloneCallbacks.add(callback); 
    }

    onClear(callback: () => void) {
        this.onClearCallbacks.add(callback);
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
        const items = this.items, itemsOrders = this.ordersByItemIds.get("") ?? [];
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
        if (newId === "") {
            let nextId = this.count + 1;
            while (this.items.has(this.idPrefix + nextId)) {
                nextId++;
            }
            newId = this.idPrefix + nextId;
        }
        const newItem = Object.assign(item, { id: newId }) as T;
        this.items.set(newId, newItem);
        let parentOrder = this.ordersByItemIds.get(item.parentId ?? "");
        if (typeof parentOrder === "undefined") {
            parentOrder = [];
            this.ordersByItemIds.set(item.parentId ?? "", parentOrder);
        }
        parentOrder.push(newId);
        this.count++;
        for (const callback of this.onAddCallbacks) {
            callback(newItem, item.id === "");
        }
        return newItem;
    }

    itemWithId(id: string|undefined): T|undefined {
        if (typeof id === "undefined") return undefined;
        return this.items.get(id);
    }

    private childrenOrder(item: T|undefined): string[] {
        if (typeof item === "undefined") {
            return [];
        } else {
            return this.ordersByItemIds.get(item.id ?? "") ?? [];
        }
    }

    hasChildren(item: T|undefined): boolean {
        const childrenOrder = this.childrenOrder(item);
        return typeof childrenOrder !== "undefined" && childrenOrder.length > 0;
    }

    numberOfChildren(item: T|undefined): number {
        if (typeof item === "undefined") return 0;
        return this.childrenOrder(item).length;
    }

    childrenOf(item: T|undefined): Iterable<T> {
        if (typeof item === "undefined") return [];
        const self = this;
        return {
            *[Symbol.iterator]() {
                for (const childId of self.childrenOrder(item)) {
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

        return newItem;
    }

    extractHierarchy(item: T|undefined, hierarchy: Hierarchy<T>|null = null): Hierarchy<T> {
        const extractHierarchyParent = (item: T|undefined, hierarchy: Hierarchy<T>|null, parent: T|undefined) => {
            if (hierarchy === null || !item) hierarchy = new (Object.getPrototypeOf(this).constructor as any)(this.idPrefix, new Map<string, T>());
            if (!item) return hierarchy!;

            const newItem = this.cloneNewItem(item);
            newItem.parentId = parent?.id;
            hierarchy!.add(newItem);
            hierarchy!.triggerOnClone(this, item, newItem, parent);
    
            for (const child of this.childrenOf(item)) {
                extractHierarchyParent(child, hierarchy, newItem);
            }
            return hierarchy!;
        }
        return extractHierarchyParent(item, hierarchy, undefined);
    }

    protected triggerOnClone(hierarchy: Hierarchy<T>, item: T, clone: T, newParent: T|undefined) {
        for (const callback of this.onCloneCallbacks) {
            callback(hierarchy, item, clone, newParent);
        }
    }

    addHierarchy(hierarchy: Hierarchy<T>, targetId: string|undefined): void {
        for (const oldItem of [...hierarchy.allItems]) {
            const item = clone(oldItem);
            if (typeof item.parentId === "undefined") item.parentId = targetId;
            const children = [...hierarchy.childrenOf(oldItem)];
            item.id = "";
            this.add(item);
            this.triggerOnClone(hierarchy, oldItem, item, undefined);
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
        for (const callback of this.onRemoveCallbacks) {
            callback(item);
        }
        for (const childId of this.childrenOrder(item)) {
            const child = this.itemWithId(childId);
            if (typeof child !== "undefined") {
                this.remove(child);
            }
        }
        this.items.delete(item.id);
        const orders = this.ordersByItemIds.get(item.parentId ?? "") ?? [];
        const index =  orders.indexOf(item.id);
        if (index >= 0) {
            orders.splice(index, 1);
        } else {
            console.error(`Trying to remove an item with a parent that doesn't exist: ${item.parentId}`);
        }
    }

    moveUp(item: T): void {
        const orders = this.ordersByItemIds.get(item.parentId ?? "") ?? [];
        const index = orders.indexOf(item.id);
        if (index > 0) {
            const tmp = orders[index - 1];
            orders[index - 1] = orders[index];
            orders[index] = tmp;
        }
        this.items.set(item.id, clone(item));
    }

    moveDown(item: T): void {
        const orders = this.ordersByItemIds.get(item.parentId ?? "") ?? [];
        const index = orders.indexOf(item.id);
        if (index < orders.length - 1) {
            const tmp = orders[index + 1];
            orders[index + 1] = orders[index];
            orders[index] = tmp;
        }
        this.items.set(item.id, clone(item));
    }

    clear() {
        for (const callback of this.onClearCallbacks) {
            callback();
        }
        this.items.clear();
        this.ordersByItemIds.clear();
    }

    clone(): Hierarchy<T> {
        const c = new Hierarchy<T>(this.idPrefix, clone(this.items));
        c.count = this.count;
        c.ordersByItemIds = clone(this.ordersByItemIds);
        return c;
    }

    toObject(): any {
        return Object.fromEntries(this.items.entries());
    }
}