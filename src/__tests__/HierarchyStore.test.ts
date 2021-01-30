import { createHierarchyStore } from "../datatypes/HierarchyStore";
import clone from "../tools/clone";
import * as Item from "../datatypes/Item";

test("Parent Children relationship", () => {
    const hierarchyStore = createHierarchyStore();
    const store = Item.createStore([hierarchyStore]);

    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });

    const [item1, item2] = store.map(ref => clone(ref));

    hierarchyStore.addChild(item1, item2);

    expect(hierarchyStore.childrenOf(item1)).toStrictEqual([item2]);
    expect(hierarchyStore.childrenOf(item2)).toStrictEqual([]);
    expect(hierarchyStore.parentOf(item1)).toStrictEqual(undefined);
    expect(hierarchyStore.parentOf(item2)).toStrictEqual(item1);
});

test("Test swap implementation", () => {
    const hierarchyStore = createHierarchyStore();
    const store = Item.createStore([hierarchyStore]);

    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });

    const [item1, item2, item3] = store.map(ref => clone(ref));
    
    hierarchyStore.addChild(item1, item2);
    hierarchyStore.addChild(item1, item3);
    item2.swap(item3);
    
    expect(hierarchyStore.childrenOf(item1)).toStrictEqual([item3, item2]);

    item1.swap(item2);

    expect(hierarchyStore.childrenOf(item1)).toStrictEqual([item2, item3]);
});

test("Cascade deletion", () => {
    const hierarchyStore = createHierarchyStore();
    const store = Item.createStore([hierarchyStore]);
    
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });
    store.add({ name: { S: "D" } });
    
    const [item1, item2, item3, item4] = store.map(ref => clone(ref));
    
    hierarchyStore.addChild(item1, item2);
    hierarchyStore.addChild(item1, item3);
    
    item1.delete();

    const allItems = store.map(ref => clone(ref));

    expect(allItems).toStrictEqual([item4]);
});

test("For each part of", () => {
    const hierarchyStore = createHierarchyStore();
    const store = Item.createStore([hierarchyStore]);
    
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });
    store.add({ name: { S: "D" } });
    store.add({ name: { S: "E" } });
    
    const [item1, item2, item3, item4, item5] = store.map(ref => clone(ref));
    
    hierarchyStore.addChild(item1, item2);
    hierarchyStore.addChild(item2, item3);
    hierarchyStore.addChild(item1, item4);

    item2.swap(item4);

    const parts: Item.Ref[] = [];

    hierarchyStore.forEachPartOf(item1, item => {
        parts.push(item);
    });

    expect(parts).toStrictEqual([item1, item4, item2, item3]);

    const parts2: Item.Ref[] = [];

    hierarchyStore.forEachPartOf(item5, item => {
        parts2.push(item);
    })

    expect(parts2).toStrictEqual([item5]);
});

test("For each leaves of", () => {
    const hierarchyStore = createHierarchyStore();
    const store = Item.createStore([hierarchyStore]);
    
    store.add({ name: { S: "A" } });
    store.add({ name: { S: "B" } });
    store.add({ name: { S: "C" } });
    store.add({ name: { S: "D" } });
    
    const [item1, item2, item3, item4] = store.map(ref => clone(ref));
    
    hierarchyStore.addChild(item1, item2);
    hierarchyStore.addChild(item1, item3);
    
    const leaves: Item.Ref[] = [];

    hierarchyStore.forEachLeavesOf(item1, item => {
        leaves.push(item);
    });

    expect(leaves).toStrictEqual([item2, item3]);

    const leaves2: Item.Ref[] = [];

    hierarchyStore.forEachLeavesOf(item4, item => {
        leaves2.push(item);
    });

    expect(leaves2).toStrictEqual([item4]);
});