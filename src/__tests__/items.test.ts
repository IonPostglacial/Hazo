import clone from "../tools/clone";
import { ItemStore } from "../datatypes/ItemStore";

test("Adding items", () => {
    const items = new ItemStore();
    items.add({ name: { S: "A" } });
    items.add({ name: { S: "B" } });
    items.add({ name: { S: "C" } });
    expect(items.map(i => i.name.S)).toStrictEqual(["A", "B", "C"]);
});

test("Getting items", () => {
    const items = new ItemStore();
    items.add({ name: { S: "A" } });
    items.add({ name: { S: "B" } });
    const [item1, item2] = items.map(i => clone(i));
    expect(items.get(item1.id)).toStrictEqual(item1);
    expect(items.get(item2.id)).toStrictEqual(item2);
    expect(items.get(item1.id)?.name.S).toBe("A");
    expect(items.get(item2.id)?.name.S).toBe("B");
});

test("Swapping items", () => {
    const items = new ItemStore();
    items.add({ name: { S: "A" } });
    items.add({ name: { S: "B" } });
    items.add({ name: { S: "C" } });
    const [item1, item2, item3] = items.map(i => clone(i));
    
    items.swap(item1, item2);

    expect(items.get(item1.id)).toStrictEqual(item1);
    expect(items.get(item2.id)).toStrictEqual(item2);
    expect(items.get(item3.id)).toStrictEqual(item3);
    expect(items.get(item1.id)?.name.S).toBe("A");
    expect(items.get(item2.id)?.name.S).toBe("B");
    expect(items.get(item3.id)?.name.S).toBe("C");
});