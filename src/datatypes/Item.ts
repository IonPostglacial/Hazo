import { defineRef, defineStore, Ref } from "./storeUtils";

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

export type Item = typeof defaultInit & {
    id: number;
    addPicture(picture: Picture): void;
    removePicture(picture: Picture): void;
};

export function createStore() {
    const names = [defaultInit.name];
    const descriptions = [defaultInit.description];
    const pictures = [defaultInit.pictures];

    const Ref: Ref<Item> = defineRef({
        on: {
            swap(ref: Ref<Item>, item: Ref<Item>) {
                [ref.id, item.id] = [item.id, ref.id];
                [ref.name, item.name] = [item.name, ref.name];
                [ref.description, item.description] = [item.description, ref.description];
                [ref.pictures, item.pictures] = [item.pictures, ref.pictures];
            },
            delete(ref: Ref<Item>) {
                ref.id = 0;
            },
        },
        methods: {
            index: 0,
            get id(): number {
                return store.ids[this.index];
            },
            set id(newId: number) {
                store.ids[this.index] = newId;
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
            set pictures(pics: Picture[]) {
                pictures[this.index] = pics;
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
        }
    });

    const store = defineStore({
        ref: Ref,
        add(item: Init) {
            names.push(item.name ?? defaultInit.name);
            descriptions.push(item.description ?? defaultInit.description);
            pictures.push(Array.from(item.pictures?? defaultInit.pictures));
        },
    });

    return store;
}