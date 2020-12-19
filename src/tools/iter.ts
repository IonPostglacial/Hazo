export function *map<T, U>(it: Iterable<T>, fn: (x:T) => U): Iterable<U> {
    for (const e of it) {
        yield fn(e);
    }
}

export function *filter<T>(it: Iterable<T>, fn: (x:T) => boolean): Iterable<T> {
    for (const e of it) {
        if (fn(e)) {
            yield e;
        }
    }
}

export function join<T>(it: Iterable<T>, separator: string): string {
    let result = "", sep = "";
    for (const e of it) {
        result += sep + e;
        sep = separator;
    }
    return result;
}