type Languages = "S" | "V" | "CN" | "EN" | "FR";
type MultilangText = Partial<Record<Languages, string>>;

export namespace Item {
    export interface Picture {
        url: string;
        content: Blob;
    }
    
    export interface Data {
        id: number;
        name: MultilangText;
        description: MultilangText;
        pictures: readonly Picture[];
    }

    export type Init = Omit<Partial<Data>, "id">;

    export function createStore() {
        const holes = new Set<number>();
        const ids = [0];
        const names: MultilangText[] = [{}];
        const descriptions: MultilangText[] = [{}];
        const pictures: Picture[][] = [[]];
        const refs: Ref[] = [];

        class Ref {
            index: number;
        
            constructor(index: number) {
                this.index = index;
                refs.push(this);
            }
        
            get id(): number {
                return ids[this.index];
            }
        
            set id(newId: number) {
                ids[this.index] = newId;
            }
        
            get name(): MultilangText {
                return names[this.index];
            }
        
            set name(newName: MultilangText) {
                names[this.index] = newName;
            }
        
            get description(): MultilangText {
                return descriptions[this.index];
            }
        
            set description(newDescription: MultilangText) {
                descriptions[this.index] = newDescription;
            }
        
            get pictures(): readonly Picture[] {
                return pictures[this.index];
            }
        
            addPicture(picture: Picture) {
                pictures[this.index].push(picture);
            }

            removePicture(picture: Picture) {
                const index = pictures[this.index].findIndex(pic => pic.url === picture.url);
                if (index >= 0) {
                    pictures[this.index].splice(index, 1);
                }
            }
        
            assign(item: Item.Data) {
                this.id = item.id;
                this.name = item.name;
                this.description = item.description;
                pictures[this.index] = Array.from(item.pictures);
            }
        
            swap(item: Ref) {
                const { id, name, description, pictures } = this;
                this.assign(item);
                item.assign({ id, name, description, pictures });
                const oldIndex1 = this.index, oldIndex2 = item.index;
                for (const ref of refs) {
                    if (ref.index === oldIndex1) {
                        ref.index = oldIndex2;
                    } else if (ref.index === oldIndex2) {
                        ref.index = oldIndex1;
                    }
                }
            }
        
            delete() {
                if (this.id !== 0) {
                    this.id = 0;
                    holes.add(this.index);
                    for (const ref of refs) {
                        if (ref.index === this.index) {
                            this.index = 0;
                        }
                    }
                }
            }
        
            clone() {
                return new Ref(this.index);
            }
        }

        var store = {
            add(item: Item.Init): void {
                ids.push(ids.length);
                names.push(item.name ?? {});
                descriptions.push(item.description ?? {});
                pictures.push(Array.from(item.pictures?? []));
            },
            getById(id: number): Ref {
                if (id >= 0 && id < ids.length) {
                    if (ids[id] === id) {
                        return new Ref(id);
                    } else {
                        const index = ids.indexOf(id);
                        if (index >= 0) {
                            return new Ref(index);
                        } else {
                            return new Ref(0);
                        }
                    }
                } else {
                    return new Ref(0);
                }
            },
            map<T>(callback: (item: Ref) => T): T[] {
                const result: T[] = [];
                this.forEach((item) => {
                    result.push(callback(item));
                });
                return result;
            },
            forEach(callback: (item: Ref) => void): void {
                for (let i = 1; i < ids.length; i++) {
                    if (ids[i] !== 0) {
                        _cachedItem.index = i;
                        callback(_cachedItem);
                    }
                }
            }
        }

        const _cachedItem = new Ref(0);

        return store;
    }
}