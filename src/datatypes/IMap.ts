export interface IMap<T> {
    get(key: string): T|undefined;
    has(key: string): boolean;
    set(key: string, value: T): void;
    delete(key: string): void;
    size: number;
    [Symbol.iterator](): Iterator<[string, T]>;
    keys(): Iterable<string>;
    values(): Iterable<T>;
    clear(): void;
    entries(): Iterable<[string, T]>;
}