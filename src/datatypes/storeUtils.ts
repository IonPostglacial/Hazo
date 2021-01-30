export type Ref = {
    index: number;
    swap(ref: Ref): void;
    delete(): void;
    clone(): Ref;
};

export type Store<RefType extends Ref> = {
    ids: readonly number[];
    makeRef(index: number): RefType;
    ref: RefType;
}

const defaultOn = {
    swap(ref: Ref): void {},
    delete() {},
};

type RefConf = Partial<typeof defaultOn>;

export function defineStore<T, U>(conf: { on: RefConf, ref: T, addItem(init: U): void }): Store<Ref & T> {
    const on = { ...defaultOn, ...conf.on};
    const ref: Ref & T = {
        index: 0,
        ...conf.ref,
        swap(ref: Ref): void {
            on.swap(ref);
        },
        delete(): void {
            on.delete();
        },
        clone(): typeof ref {
            return makeRef(0);
        },
    };
    const refs: (typeof ref)[] = [];

    function makeRef(index: number): Ref & T {
        const newRef = Object.create(ref);
        newRef.index = index;
        refs.push(newRef);
        return newRef;
    }
    
    const store = {
        ref,
        ids: [0],
        makeRef,
        add(item: U): number {
            const newItemId = store.ids.length;
            store.ids.push(newItemId);
            conf.addItem(item);
            return newItemId;
        },
        getById(id: number): Ref {
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
        },
        map<T>(callback: (item: Ref) => T): T[] {
            const result: T[] = [];
            store.forEach(item => {
                result.push(callback(item));
            });
            return result;
        },
        forEach(callback: (item: Ref) => void): void {
            for (let i = 1; i < store.ids.length; i++) {
                if (store.ids[i] !== 0) {
                    store.ref.index = i;
                    callback(store.ref);
                }
            }
        }
    };
    return store;
}

export function getRefById<RefType extends Ref>(store: Store<RefType>, id: number): RefType {
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

export function map<RefType extends Ref, T>(store: Store<RefType>, callback: (item: RefType) => T): T[] {
    const result: T[] = [];
    forEach(store, (item) => {
        result.push(callback(item));
    });
    return result;
}

export function forEach<RefType extends Ref>(store: Store<RefType>, callback: (item: RefType) => void): void {
    for (let i = 1; i < store.ids.length; i++) {
        if (store.ids[i] !== 0) {
            store.ref.index = i;
            callback(store.ref);
        }
    }
}

export function swapRefIndices<RefType extends Ref>(refs: RefType[], index1: number, index2: number): void {
    for (const ref of refs) {
        if (ref.index === index1) {
            ref.index = index2;
        } else if (ref.index === index2) {
            ref.index = index1;
        }
    }
}

export function deleteRef<RefType extends Ref>(refs: RefType[], refToDelete: Ref): void {
    const indexToDelete = refToDelete.index;
    for (const ref of refs) {
        if (ref.index === indexToDelete) {
            ref.index = 0;
        }
    }
}