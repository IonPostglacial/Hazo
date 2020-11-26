import Vue from "vue";
import clone from "./clone";

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

    keys(): Iterable<string> {
        const entries = this.r;
        return {
            *[Symbol.iterator]() {
                for (const property in entries) {
                    yield property;
                }
            }
        }
    }

    values(): Iterable<T> {
        const entries = this.r;
        return {
            *[Symbol.iterator]() {
                for (const property in entries) {
                    yield entries[property];
                }
            }
        }
    }

    clear() {
        for (const key of Object.keys(this.r)) {
            Vue.delete(this.r, key);
        }
    }

    clone(): ObservableMap<T> {
        return ObservableMap.fromObject(clone(this.r));
    }

    static fromObject<T>(object: Record<string, T>) {
        const m = new ObservableMap<T>();
        m.r = object;
        return m;
    }

    entries(): Iterable<[string, T]> {
        return Object.entries(this.r);
    }
}