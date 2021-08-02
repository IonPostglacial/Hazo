export function* map<T, U>(it: Iterable<T>, fn: (x: T) => U): Iterable<U> {
    for (const e of it) {
        yield fn(e);
    }
}

export function* filter<T>(it: Iterable<T>, fn: (x: T) => boolean): Iterable<T> {
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


export function get(obj: any, ...path: any[]) {
    switch (path.length) {
        case 0: return obj;
        case 1: return obj[path[0]];
        case 2: return obj[path[0]][path[1]];
        case 3: return obj[path[0]][path[1]][path[2]];
        case 4: return obj[path[0]][path[1]][path[2]][path[3]];
        default: {
            let cur = obj;
            for (const key of path) {
                cur = cur[key];
            }
            return cur;
        }
    }
}