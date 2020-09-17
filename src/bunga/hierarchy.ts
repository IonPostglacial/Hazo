import { HierarchicalItem } from "./datatypes";

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

    constructor(idPrefix: string, items: IMap<T>) {
        this.idPrefix = idPrefix;
        this.items = items;
        this.itemsOrder = [];
        for (const item of items.values()) {
            if (item.topLevel) {
                this.itemsOrder.push(item.id);
            }
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

    addItem(item: Omit<T, "id"> & { id?: string }): T {
        let newId = item.id; 
        if (typeof newId === "undefined" || newId === null || newId === "") {
            let nextId = this.itemsOrder.length;
            while (this.items.has(this.idPrefix + nextId)) {
                nextId++;
            }
            newId = this.idPrefix + nextId;
        }
        const newItem = Object.assign(item, { id: newId }) as T;
        this.items.set(newId, newItem);

        if (typeof newItem.parentId === "undefined") {
            this.itemsOrder.push(newId);
        } else {
            const parent = this.items.get(newItem.parentId);
            if (typeof parent === "undefined") {
                console.warn(`Added item "${newItem.name}" with an invalid parent id: ${newItem.parentId}`);
            } else {
                parent.children = { ...parent.children, [newId]: newItem };
                if(typeof parent.childrenOrder === "undefined") {
                    parent.childrenOrder = Object.keys(parent.children);
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

    getItemById(id: string): T|undefined {
        return this.items.get(id);
    }

    setItem(item: T): void {
        if(!item.id) {
            console.warn(`Hierarchy: Trying to set an item with no id: ${item.name}`);
            return;
        }
        if(typeof item.childrenOrder === "undefined") {
            item.childrenOrder = Object.keys(item.children);
        }
        const emptyChildIndex = item.childrenOrder.indexOf("");
        if (emptyChildIndex >= 0) {
            console.warn(`Cannot import child with no id: ${item.name} > ${item.children[""]?.name}`)
            item.childrenOrder.splice(emptyChildIndex, 1);
            delete item.children[""];
        }
        if (this.items.has(item.id)) {
            this.items.set(item.id, item);
        
            if (typeof item.parentId !== "undefined") {
                const parent = this.items.get(item.parentId);
                if (typeof parent === "undefined") {
                    console.error(`Trying to set an item to a parent that doesn't exist: ${item.parentId}`);
                } else {
                    parent.children[item.id] = item;
                }
            }
        } else {
            this.addItem(item);
        }
    }

    removeItem(item: T): void {
        this.items.delete(item.id);
        const order = this.itemsOrder.indexOf(item.id);

        if (typeof item.parentId === "undefined") {
            this.itemsOrder.splice(order, 1);
        } else {
            const parent = this.items.get(item.parentId);
            if (typeof parent === "undefined") {
                console.error(`Trying to remove an item with a parent that doesn't exist: ${item.parentId}`);
            } else {
                const childOrder = parent.childrenOrder.indexOf(item.id);
                parent.childrenOrder.splice(childOrder, 1);
                const newChildren = { ...parent.children };
                delete newChildren[item.id];
                parent.children = newChildren;
            }
        }
    }

    moveItemUp(item: T): void {
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
        this.setItem({...item});
    }

    moveItemDown(item: T): void {
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
        this.setItem({...item});
    }

    clear() {
        this.items.clear();
        this.itemsOrder = [];
    }

    toObject(): any {
        return this.items.toObject();
    }
}