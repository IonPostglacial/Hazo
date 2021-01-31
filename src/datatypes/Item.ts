import { defineStore, Ref } from "./storeUtils";

type Languages = "S" | "V" | "CN" | "EN" | "FR";
type MultilangText = Partial<Record<Languages, string>>;

export type Picture = {
    url: string;
    content: Blob;
}

const defaultInit = {
    name: {} as MultilangText,
    description: {} as MultilangText,
    pictures: [] as Picture[],
};

export type Init = Partial<typeof defaultInit>;

export type ItemData = typeof defaultInit & { id: number };

export type Item = ItemData & {
    addPicture(picture: Picture): void;
    removePicture(picture: Picture): void;
}
export type Store = ReturnType<typeof createStore>;

export function createStore() {
    const ids = [0];
    const names = [defaultInit.name];
    const descriptions = [defaultInit.description];
    const pictures = [defaultInit.pictures];

    const Ref: Ref<Item> = {
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
        get pictures(): Picture[] {
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
        swap(item: Ref<Item>) {
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

    function assign(ref: Ref<Item>, item: ItemData) {
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
            names.push(item.name ?? defaultInit.name);
            descriptions.push(item.description ?? defaultInit.description);
            pictures.push(Array.from(item.pictures?? defaultInit.pictures));
            return newItemId;
        },
    });

    return store;
}