export type Ref<T> = T & {
    index: number;
    swap(ref: Ref<T>): void;
    delete(): void;
    clone(): Ref<T>;
};

export type Store<T> = {
    ids: readonly number[];
    makeRef(index: number): Ref<T>;
    ref: Ref<T>;
}

export function defineStore<T, U>(ids: number[], conf: { ref: Ref<T>, add(init: U): number }): Store<T> {
    const refs: Ref<T>[] = [];

    function makeRef(index: number): Ref<T> {
        const newRef = Object.create(conf.ref);
        newRef.index = index;
        refs.push(newRef);
        return newRef;
    }
    
    const store = {
        ids,
        ref: makeRef(0),
        makeRef,
        add(item: U): number {
            return conf.add(item);
        },
        getById(id: number): Ref<T> {
            if (id >= 0 && id < ids.length) {
                if (ids[id] === id) {
                    return store.makeRef(id);
                } else {
                    const index = ids.indexOf(id);
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
            for (let i = 1; i < ids.length; i++) {
                if (ids[i] !== 0) {
                    store.ref.index = i;
                    callback(store.ref);
                }
            }
        }
    };
    return store;
}

export function getRefById<T>(store: Store<T>, id: number): Ref<T> {
    if (id >= 0 && id < store.ids.length) {
        if (store.ids[id] === id) {
            return store.makeRef(id);
        } else {
            const index = store.ids.indexOf(id);
            if (index >= 0) {
                return store.makeRef(index);
            } else {
                return store.makeRef(0);
            }
        }
    } else {
        return store.makeRef(0);
    }
}

export function map<T, U>(store: Store<T>, callback: (item: Ref<T>) => U): U[] {
    const result: U[] = [];
    forEach(store, (item) => {
        result.push(callback(item));
    });
    return result;
}

export function forEach<T>(store: Store<T>, callback: (item: Ref<T>) => void): void {
    for (let i = 1; i < store.ids.length; i++) {
        if (store.ids[i] !== 0) {
            store.ref.index = i;
            callback(store.ref);
        }
    }
}

export function swapRefIndices<T>(refs: Ref<T>[], index1: number, index2: number): void {
    for (const ref of refs) {
        if (ref.index === index1) {
            ref.index = index2;
        } else if (ref.index === index2) {
            ref.index = index1;
        }
    }
}

export function deleteRef<T>(refs: Ref<T>[], refToDelete: Ref<T>): void {
    const indexToDelete = refToDelete.index;
    for (const ref of refs) {
        if (ref.index === indexToDelete) {
            ref.index = 0;
        }
    }
}