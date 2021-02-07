import { Node, createStore } from "../datatypes/Node";
import * as Item from "../datatypes/Item";
import { Ref } from "../datatypes/storeUtils";
import clone from "../tools/clone";

test("Parent Children relationship", () => {
    const store = createStore(Item.createStore());

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
    const store = createStore(Item.createStore());

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
    const store = createStore(Item.createStore());
    
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
    const store = createStore(Item.createStore());

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
    const store = createStore(Item.createStore());
    
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

test("Share Item store between multiple Node stores", () => {
    const itemStore = Item.createStore();
    const nodeStore1 = createStore(itemStore);
    const nodeStore2 = createStore(itemStore);

    nodeStore1.add({ name: { S: "a" } });
    nodeStore2.add({ name: { S: "A" } });
    nodeStore1.add({ name: { S: "b" } });
    nodeStore2.add({ name: { S: "B" } });
    nodeStore1.add({ name: { S: "c" } });
    nodeStore2.add({ name: { S: "C" } });
    nodeStore1.add({ name: { S: "d" } });
    nodeStore2.add({ name: { S: "D" } });

    const [item1, item2, item3, item4] = nodeStore1.map(ref => clone(ref));
    const [item1b, item2b, item3b, item4b] = nodeStore2.map(ref => clone(ref));

    item1.addChild(item2);
    item1.addChild(item3);
    item1.addChild(item4);

    item1b.addChild(item2b);
    item3b.addChild(item4b);

    item2.swap(item3);

    expect(item1.children).toStrictEqual([item3, item2, item4]);
    expect(item1b.children).toStrictEqual([item2b]);
    expect(item3b.children).toStrictEqual([item4b]);

    item1.delete();

    expect(itemStore.map(ref => ref).length).toBe(4);
});