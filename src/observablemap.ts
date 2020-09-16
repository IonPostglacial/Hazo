import Vue from "vue";

export class ObservableMap<T> {
    r = {} as Record<string, T>;

    get(key: string): T|undefined {
        return this.r[key];
    }

    has(key: string): boolean {
        return typeof this.r[key] !== "undefined";
    }

    set(key: string, value: T): void {
        Vue.set(this.r, key, value);
    }

    delete(key: string): void {
        Vue.delete(this.r, key);
    }

    [Symbol.iterator](): Iterator<[string, T]> {
        return Object.entries(this.r)[Symbol.iterator]();
    }

    values(): Array<T> {
        return Object.values(this.r);
    }

    clear() {
        for (const key of Object.keys(this.r)) {
            Vue.delete(this.r, key);
        }
    }

    toObject(): any {
        return this.r;
    }
}