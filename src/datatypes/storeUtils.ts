export type Ref<T> = T & {
    index: number;
    swap(ref: Ref<T>): void;
    delete(): void;
    clone(): Ref<T>;
};

export type Store<T> = {
    ids: number[];
    makeRef(index: number): Ref<T>;
    ref: Ref<T>;
}

export function defineStore<T, U>(conf: { ids: number[], ref: Ref<T>, add(init: U): number }) {
    const refs: Ref<T>[] = [];

    function makeRef(index: number): Ref<T> {
        const newRef = Object.create(conf.ref);
        newRef.index = index;
        refs.push(newRef);
        return newRef;
    }
    
    const store = {
        ids: conf.ids,
        ref: makeRef(0),
        makeRef,
        add(item: U): number {
            return conf.add(item);
        },
        getById(id: number): Ref<T> {
            if (id >= 0 && id < conf.ids.length) {
                if (conf.ids[id] === id) {
                    return store.makeRef(id);
                } else {
                    const index = conf.ids.indexOf(id);
                    if (index >= 0) {
                        return store.makeRef(index);
                    } else {
                        return store.makeRef(0);
                    }
                }
            } else {
                return store.makeRef(0);
            }
        },
        map<V>(callback: (item: Ref<T>) => V): V[] {
            const result: V[] = [];
            store.forEach(item => {
                result.push(callback(item));
            });
            return result;
        },
        forEach(callback: (item: Ref<T>) => void): void {
            for (let i = 1; i < conf.ids.length; i++) {
                if (conf.ids[i] !== 0) {
                    store.ref.index = i;
                    callback(store.ref);
                }
            }
        },
        swapRefs<T>(index1: number, index2: number): void {
            for (const ref of refs) {
                if (ref.index === index1) {
                    ref.index = index2;
                } else if (ref.index === index2) {
                    ref.index = index1;
                }
            }
        },
        deleteRef<T>(refToDelete: Ref<T>): void {
            const indexToDelete = refToDelete.index;
            for (const ref of refs) {
                if (ref.index === indexToDelete) {
                    ref.index = 0;
                }
            }
        },
    };
    return store;
}