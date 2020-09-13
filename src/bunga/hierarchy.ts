import { HierarchicalItem } from "./datatypes";

interface IMap<T> {
    get(key: string): T;
    has(key: string): boolean;
    set(key: string, value: T): void;
    delete(key: string): void;
}

export class Hierarchy<T extends HierarchicalItem<T>> {
    private idPrefix: string;
    readonly items: IMap<HierarchicalItem<T>>;
    private itemsOrder: string[];

    constructor(idPrefix: string, items: IMap<T>) {
        this.idPrefix = idPrefix;
        this.items = items;
        this.itemsOrder = Object.values(items).
            filter(item => typeof item.parentId === "undefined").
            map(item => item.id);
    }

    get topLevelItems(): HierarchicalItem<T>[] {
        return this.itemsOrder.map(id => this.items.get(id));
    }

    addItem(item: Omit<T, "id">): void {
        let nextId = this.itemsOrder.length;
        while (this.items.has(this.idPrefix + nextId)) {
            nextId++;
        }
        const newId = this.idPrefix + nextId;
        const newItem = Object.assign(item, { id: newId }) as T;
        this.items.set(newId, newItem);
        this.itemsOrder.push(newId);
        
        if (typeof newItem.parentId !== "undefined") {
            const parent = this.items.get(newItem.parentId);
            if (typeof parent === "undefined") {
                console.error(`Trying to add an item to a parent that doesn't exist: ${newItem.parentId}`);
            } else {
                parent.children[newId] = newItem;
                parent.childrenOrder.push(newId);
            }
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
}