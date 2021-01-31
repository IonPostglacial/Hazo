import { Node, createStore } from "../datatypes/Node";
import { Ref } from "../datatypes/storeUtils";
import clone from "../tools/clone";

test("Parent Children relationship", () => {
    const store = createStore();

    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });

    const [item1, item2] = store.map(ref => clone(ref));

    item1.addChild(item2);

    expect(item1.children).toStrictEqual([item2]);
    expect(item2.children).toStrictEqual([]);
    expect(item1.parent).toStrictEqual(undefined);
    expect(item2.parent).toStrictEqual(item1);
});

test("Test swap implementation", () => {
    const store = createStore();

    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });

    const [item1, item2, item3] = store.map(ref => clone(ref));
    
    item1.addChild(item2);
    item1.addChild(item3);

    item2.swap(item3);
    
    expect(item1.children).toStrictEqual([item3, item2]);

    item1.swap(item2);

    expect(item1.children).toStrictEqual([item2, item3]);
});

test("Cascade deletion", () => {
    const store = createStore();
    
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });
    store.add({ name: { S: "D" } });
    
    const [item1, item2, item3, item4] = store.map(ref => clone(ref));
    
    item1.addChild(item2);
    item1.addChild(item3);
    
    item1.delete();

    const allItems = store.map(ref => clone(ref));

    expect(allItems).toStrictEqual([item4]);
});

test("For each part of", () => {
    const store = createStore();

    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });
    store.add({ name: { S: "D" } });
    store.add({ name: { S: "E" } });
    
    const [item1, item2, item3, item4, item5] = store.map(ref => clone(ref));
    
    item1.addChild(item2);
    item2.addChild(item3);
    item1.addChild(item4);

    item2.swap(item4);

    const parts: Ref<Node>[] = [];

    item1.forEachNode(node => {
        parts.push(node);
    });

    expect(parts).toStrictEqual([item1, item4, item2, item3]);

    const parts2: Ref<Node>[] = [];

    item5.forEachNode(item => {
        parts2.push(item);
    });

    expect(parts2).toStrictEqual([item5]);
});

test("For each leaves of", () => {
    const store = createStore();
    
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });
    store.add({ name: { S: "D" } });
    
    const [item1, item2, item3, item4] = store.map(ref => clone(ref));
    
    item1.addChild(item2);
    item1.addChild(item3);
    
    const leaves: Ref<Node>[] = [];

    item1.forEachLeaves(node => {
        leaves.push(node);
    });

    expect(leaves).toStrictEqual([item2, item3]);

    const leaves2: Ref<Node>[] = [];

    item4.forEachLeaves(node => {
        leaves2.push(node);
    });

    expect(leaves2).toStrictEqual([item4]);
});