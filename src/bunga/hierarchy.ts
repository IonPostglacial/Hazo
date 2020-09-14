import { HierarchicalItem } from "./datatypes";

interface IMap<T> {
    get(key: string): T;
    has(key: string): boolean;
    set(key: string, value: T): void;
    delete(key: string): void;
    [Symbol.iterator](): Iterator<[string, T]>;
    values(): Array<T>;
    clear(): void;
    toObject(): any;
}

export class Hierarchy<T extends HierarchicalItem<T>> {
    private idPrefix: string;
    private items: IMap<T>;
    get allItems(): Array<T> {
        return this.items.values();
    }
    private itemsOrder: string[];

    constructor(idPrefix: string, items: IMap<T>) {
        this.idPrefix = idPrefix;
        this.items = items;
        this.itemsOrder = items.values().
            filter(item => item.topLevel).
            map(item => item.id);
    }

    get topLevelItems(): HierarchicalItem<T>[] {
        return this.itemsOrder.map(id => this.items.get(id));
    }

    addItem(item: Omit<T, "id"> & { id?: string }): T {
        let newId = item.id; 
        if (typeof newId === "undefined") {
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
                    parent.childrenOrder.push(newId);
                }
            }
        }
        return newItem;
    }

    getItemById(id: string): T {
        return this.items.get(id);
    }

    setItem(item: T): void {
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
        this.itemsOrder.splice(order, 1);

        if (typeof item.parentId !== "undefined") {
            const parent = this.items.get(item.parentId);
            if (typeof parent === "undefined") {
                console.error(`Trying to remove an item with a parent that doesn't exist: ${item.parentId}`);
            } else {
                delete parent.children[item.id];
            }
        }
    }

    clear() {
        this.items.clear();
        this.itemsOrder = [];
    }

    toObject(): any {
        return this.items.toObject();
    }
}