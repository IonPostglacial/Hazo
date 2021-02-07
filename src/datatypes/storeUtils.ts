export type Ref<T> = T & {
    index: number;
    swap(ref: Ref<T>): void;
    delete(): void;
    clone(): Ref<T>;
};

type RefConf<T> = {
    on: {
        swap(ref1: Ref<T>, ref2: Ref<T>): void;
        delete(ref: Ref<T>): void;
    },
    methods: T & ThisType<Ref<T>> & { index: number }
}

export function defineRef<T>(conf: RefConf<T>): Ref<T> {
    const refs: Ref<T>[] = [];
    const Ref = Object.assign(conf.methods, {
        swap(this: Ref<T>, ref: Ref<T>): void {
            conf.on.swap(this, ref);
            const index1 = this.index, index2 = ref.index;
            for (const ref of refs) {
                if (ref.index === index1) {
                    ref.index = index2;
                } else if (ref.index === index2) {
                    ref.index = index1;
                }
            }
        },
        delete(this: Ref<T>): void {
            conf.on.delete(this);
            const indexToDelete = this.index;
            for (const ref of refs) {
                if (ref.index === indexToDelete) {
                    ref.index = 0;
                }
            }
        },
        clone(this: Ref<T>): Ref<T> {
            const ref = Object.create(Ref);
            ref.index = this.index;
            refs.push(ref);
            return ref;
        }
    });
    return Ref;
}

export function defineStore<T, U>(conf: { ref: Ref<T>, add(init: U): void }) {
    const refs: Ref<T>[] = [];

    function makeRef(index: number): Ref<T> {
        const newRef = Object.create(conf.ref);
        newRef.index = index;
        refs.push(newRef);
        return newRef;
    }
    
    const store = {
        ids: [0],
        ref: makeRef(0),
        makeRef,
        add(item: U): Ref<T> {
            const newItemId = store.ids.length;
            store.ids.push(newItemId);
            conf.add(item);
            return makeRef(newItemId);
        },
        getById(id: number): Ref<T> {
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
        map<V>(callback: (item: Ref<T>) => V): V[] {
            const result: V[] = [];
            store.forEach(item => {
                result.push(callback(item));
            });
            return result;
        },
        forEach(callback: (item: Ref<T>) => void): void {
            for (let i = 1; i < store.ids.length; i++) {
                if (store.ids[i] !== 0) {
                    store.ref.index = i;
                    callback(store.ref);
                }
            }
        },
    };
    return store;
}