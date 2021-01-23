
type Languages = "S" | "V" | "CN" | "EN" | "FR";
type MultilangText = Partial<Record<Languages, string>>;

interface ItemInit {
    name: MultilangText;
    descriptions?: MultilangText;
    picture?: { url: string, content?: Blob };
}

export class Item {
    #store: ItemStore;
    index: number;

    constructor(store: ItemStore, index: number) {
        this.#store = store;
        this.index = index;
        this.#store.onSwapped((item1, item2) => {
            if (this !== item1 && this !== item2) {
                if (this.index === item1.index) {
                    this.index = item2.index;
                } else if (this.index === item2.index) {
                    this.index = item1.index;
                }
            }
        });
    }

    get id(): number {
        return this.#store._ids[this.index];
    }

    get name(): MultilangText {
        return this.#store._names[this.index];
    }

    get description(): MultilangText {
        return this.#store._descriptions[this.index];
    }

    get pictureUrl(): string {
        return this.#store._pictureUrls[this.index];
    }

    get pictureContents(): Blob {
        return this.#store._pictureContents[this.index];
    }

    clone() {
        return new Item(this.#store, this.index);
    }
}

export class ItemStore {
    _idHoles: Set<number> = new Set();
    _ids: number[] = [];
    _names: MultilangText[] = [];
    _descriptions: MultilangText[] = [];
    _pictureUrls: string[] = [];
    _pictureContents: Blob[] = [];
    #cachedItem: Item;
    #onswappedListeners: Array<(item1: Item, item2: Item) => void> = [];

    constructor() {
        this.#cachedItem = new Item(this, -1);
    }

    add(item: ItemInit): void {
        this._ids.push(this._ids.length);
        this._names.push(item.name);
        this._descriptions.push(item.descriptions ?? {});
        this._pictureUrls.push(item.picture?.url ?? "");
        this._pictureContents.push(item.picture?.content ?? new Blob([]));
    }

    get(id: number): Readonly<Item>|null {
        if (id >= 0 && id < this._ids.length) {
            if (this._ids[id] === id) {
                return Object.freeze(new Item(this, id));
            } else {
                const index = this._ids.indexOf(id);
                if (index >= 0) {
                    return Object.freeze(new Item(this, index));
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    }

    remove(item: Readonly<Item>): void {
        this._ids[item.index] = -1;
        this._idHoles.add(item.index);
    }

    map<T>(callback: (item: Item) => T): T[] {
        const result: T[] = [];
        this.forEach((item) => {
            result.push(callback(item));
        });
        return result;
    }

    onSwapped(callback: (item1: Item, item2: Item) => void): void {
        this.#onswappedListeners.push(callback);
    }

    swap(item1: Item, item2: Item): void {
        [this._ids[item1.index], this._ids[item2.index]] = [this._ids[item2.index], this._ids[item1.index]];
        [this._names[item1.index], this._names[item2.index]] = [this._names[item2.index], this._names[item1.index]];
        [this._descriptions[item1.index], this._descriptions[item2.index]] = [this._descriptions[item2.index], this._descriptions[item1.index]];
        [this._pictureUrls[item1.index], this._pictureUrls[item2.index]] = [this._pictureUrls[item2.index], this._pictureUrls[item1.index]];
        [this._pictureContents[item1.index], this._pictureContents[item2.index]] = [this._pictureContents[item2.index], this._pictureContents[item1.index]];
        [item1.index, item2.index] = [item2.index, item1.index];
        for (const listener of this.#onswappedListeners) {
            listener(item1, item2);
        }
    }
    
    forEach(callback: (item: Item) => void): void {
        for (let i = 0; i < this._ids.length; i++) {
            if (this._ids[i] !== -1) {
                this.#cachedItem.index = i;
                callback(this.#cachedItem);
            }
        }
    }
}