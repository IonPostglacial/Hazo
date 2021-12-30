export function generateId(prefix: string, items: { has(key: string): boolean, size: number }, item: { id: string }): string {
    let id = item.id;
    if (id === "") {
        let i = items.size;
        do {
            id = prefix + i;
            i++;
        } while(items.has(id));
    }
    return id;
}