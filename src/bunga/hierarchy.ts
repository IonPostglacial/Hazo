import { HierarchicalItem } from "./datatypes";
import clone from "../clone";

interface IMap<T> {
    get(key: string): T|undefined;
    has(key: string): boolean;
    set(key: string, value: T): void;
    delete(key: string): void;
    [Symbol.iterator](): Iterator<[string, T]>;
    values(): Iterable<T>;
    clear(): void;
    toObject(): any;
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
        return this.items.values();
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
            if (typeof parent === "undefined") {
                console.warn(`Added item "${newItem.name}" with an invalid parent id: ${newItem.parentId}`);
            } else {
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

    itemWithId(id: string): T|undefined {
        return this.items.get(id);
    }

    hasChildren(item: T): boolean {
        return typeof item.childrenOrder !== "undefined" && item.childrenOrder.length > 0;
    }

    childrenOf(item: T): Iterable<T> {
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

    getLeaves(item: T): Iterable<T> {
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
        return this.items.toObject();
    }
}