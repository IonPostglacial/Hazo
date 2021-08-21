export type SetLike = { has(key: string): boolean, size: number };

export function generateId(prefix: string, items: SetLike, id?: string): string {
    if (typeof id === "undefined" || id === "") {
        let i = items.size;
        do {
            id = prefix + i;
            i++;
        } while(items.has(id));
    }
    return id;
}

export function itemWithIdNotIn<T extends { id: string }>(items: SetLike): (item: T) => T {
	return function (item: T) {
		return { ...item, id: generateId(item.id.charAt(0), items) };
	};
}