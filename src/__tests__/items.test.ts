import clone from "../tools/clone";
import { Item } from "../datatypes/Item";

test("Adding items", () => {
    const store = Item.createStore();
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });
    expect(store.map(i => i.name.S)).toStrictEqual(["A", "B", "C"]);
});

test("Getting items", () => {
    const store = Item.createStore();
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    const [item1, item2] = store.map(i => clone(i));
    expect(store.getById(item1.id)).toStrictEqual(item1);
    expect(store.getById(item2.id)).toStrictEqual(item2);
    expect(item1.name.S).toBe("A");
    expect(item2.name.S).toBe("B");
});

test("Swapping items", () => {
    const store = Item.createStore();
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });
    const [item1, item2, item3] = store.map(i => clone(i));
    const item1clone = item1.clone();
    const item2clone = item2.clone();

    item1.swap(item2);

    const [item1b, item2b, item3b] = store.map(i => clone(i));

    expect(item1b.name.S).toBe("B");
    expect(item2b.name.S).toBe("A");
    expect(item3b.name.S).toBe("C");
    expect(store.getById(item1.id)).toStrictEqual(item1);
    expect(store.getById(item2.id)).toStrictEqual(item2);
    expect(store.getById(item3.id)).toStrictEqual(item3);
    expect(item1.name.S).toBe("A");
    expect(item2.name.S).toBe("B");
    expect(item3.name.S).toBe("C");
    expect(item1clone.name.S).toBe("A");
    expect(item2clone.name.S).toBe("B");
});

test("Deleting items", () => {
    const store = Item.createStore();
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });

    const [item1, item2, item3] = store.map(i => clone(i));
    const item1clone = item1.clone();

    expect(item1.name.S).toBe("A");
    expect(item1clone.name.S).toBe("A");
    expect(item2.name.S).toBe("B");
    expect(item3.name.S).toBe("C");

    item1.delete();

    const [item1b, item2b] = store.map(i => clone(i));

    expect(item1b.name.S).toBe("B");
    expect(item2b.name.S).toBe("C");
    expect(item1.id).toBe(0);
    expect(item1clone.id).toBe(0);

    store.add({ name: { S: "A" } });
    item2b.delete();

    const [item1c, item2c] = store.map(i => clone(i));

    expect(item1c.name.S).toBe("B");
    expect(item2c.name.S).toBe("A");
});

test("Companion stores", () => {
    const added: (string|undefined)[] = [], swapped: [(string|undefined), (string|undefined)][] = [], deleted: (string|undefined)[] = [];
    const store = Item.createStore([
        {
            itemAdded(item) {
                added.push(item.name.S);
            },
            itemsSwapped(item1, item2) {
                swapped.push([item1.name.S, item2.name.S]);
            },
            itemDeleted(item) {
                deleted.push(item.name.S);
            },
        }
    ]);
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    const [item1, item2] = store.map(i => clone(i));
    item1.swap(item2);
    item1.delete();

    expect(added).toStrictEqual([undefined, "A", "B"]);
    expect(swapped).toStrictEqual([["A", "B"]]);
    expect(deleted).toStrictEqual(["A"]);
});