import { defineStore } from "./storeUtils";

type Languages = "S" | "V" | "CN" | "EN" | "FR";
type MultilangText = Partial<Record<Languages, string>>;


export type Picture = {
    url: string;
    content: Blob;
}

export type Item = {
    id: number;
    name: MultilangText;
    description: MultilangText;
    pictures: readonly Picture[];
}

export type Init = Omit<Partial<Item>, "id">;
export type Ref = Item & {
    index: number;
    swap(ref: Ref): void;
    delete(): void;
    clone(): Ref;
    addPicture(picture: Picture): void;
    removePicture(picture: Picture): void;
}
export type Store = ReturnType<typeof createStore>;

export function createStore() {
    const ids = [0];
    const names: MultilangText[] = [{}];
    const descriptions: MultilangText[] = [{}];
    const pictures: Picture[][] = [[]];

    const Ref: Ref = {
        index: 0,

        get id(): number {
            return ids[this.index];
        },
        set id(newId: number) {
            ids[this.index] = newId;
        },
        get name(): MultilangText {
            return names[this.index];
        },
        set name(newName: MultilangText) {
            names[this.index] = newName;
        },
        get description(): MultilangText {
            return descriptions[this.index];
        },
        set description(newDescription: MultilangText) {
            descriptions[this.index] = newDescription;
        },
        get pictures(): readonly Picture[] {
            return pictures[this.index];
        },
        addPicture(picture: Picture) {
            pictures[this.index].push(picture);
        },
        removePicture(picture: Picture) {
            const index = pictures[this.index].findIndex(pic => pic.url === picture.url);
            if (index >= 0) {
                pictures[this.index].splice(index, 1);
            }
        },
        swap(item: Ref) {
            const { id, name, description, pictures } = this;
            assign(this, item);
            assign(item, { id, name, description, pictures });
            store.swapRefs(this.index, item.index);
        },
        delete() {
            if (this.id !== 0) {
                this.id = 0;
                store.deleteRef(this);
            }
        },
        clone() {
            return store.makeRef(this.index);
        }
    }

    function assign(ref: Ref, item: Item) {
        ref.id = item.id;
        ref.name = item.name;
        ref.description = item.description;
        pictures[ref.index] = Array.from(item.pictures);
    }

    const store = defineStore({
        ids,
        ref: Ref,
        add(item: Init): number {
            const newItemId = ids.length;
            ids.push(newItemId);
            names.push(item.name ?? {});
            descriptions.push(item.description ?? {});
            pictures.push(Array.from(item.pictures?? []));
            return newItemId;
        },
    });

    return store;
}