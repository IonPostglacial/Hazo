import clone from "@/tools/clone";

export type Hierarchy<T> = T & {
    children: Hierarchy<T>[];
}

export function getIn<T>(hierarchy: Hierarchy<T>, path: number[]): Hierarchy<T> {
    let h = hierarchy;
    for (const i of path) {
        h = h.children[i];
    }
    return h;
}

export function forEachHierarchy<T>(hierarchy: Hierarchy<T>, cb: (h:Hierarchy<T>, path: number[])=>void, path: number[] = []) {
    cb(hierarchy, path);
    for (const [i, child] of hierarchy.children.entries()) {
        forEachHierarchy(child, cb, [...path, i]);
    }
}

export function* iterHierarchy<T>(hierarchy: Hierarchy<T>): Generator<Hierarchy<T>> {
    yield hierarchy;
    for (const child of hierarchy.children) {
        yield* iterHierarchy(child);
    }
}

export function forEachLeaves<T>(hierarchy: Hierarchy<T>, cb: (h:Hierarchy<T>)=>void) {
    forEachHierarchy(hierarchy, node => {
        if (node.children.length === 0) {
            cb(node);
        }
    });
}

export function cloneHierarchy<T>(hierarchy: Hierarchy<T>): Hierarchy<T> {
    return clone(hierarchy);
}

export function transformHierarchy<T, U>(hierarchy: Hierarchy<T>, transform: { filter: (h:Hierarchy<T>)=>boolean, map: (j:Hierarchy<T>)=>Hierarchy<U>}): Hierarchy<any> {
    const children = [];

    for (const child of hierarchy.children) {
        if (transform.filter(child)) {
            children.push(transform.map(transformHierarchy(child, transform)));
        }
    }
    return { ...hierarchy, children };
}