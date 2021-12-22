import { createTaxon, Taxon } from "../datatypes";
import { Hierarchy } from "../datatypes/hierarchy";

test("Empty hierarchy", () => {
    const hierarchy = new Hierarchy("", new Map());
    const object = hierarchy.toObject();
    expect(Array.from(hierarchy.allItems).length).toBe(0);
    expect(Object.keys(object).length).toBe(0);
});

test("Addition of items with ids", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    const taxon1 = createTaxon({ id: "1", name: { S: "" }, parentId: undefined });
    const taxon2 = createTaxon({ id: "2", name: { S: "" }, parentId: undefined });
    const taxon1b = createTaxon({ id: "1", name: { S: "" }, parentId: undefined });
    hierarchy.add(taxon1);
    hierarchy.add(taxon2);
    expect(hierarchy.itemWithId("1")).toBe(taxon1);
    expect(hierarchy.itemWithId("2")).toBe(taxon2);
    hierarchy.add(taxon1b);
    expect(hierarchy.itemWithId("1")).toBe(taxon1b);
    expect(Array.from(hierarchy.allItems).length).toBe(2);
});

test("Addition of items without ids", () => {
    const hierarchy = new Hierarchy<Taxon>("t", new Map());
    const taxon1 = createTaxon({ id: "", name: { S: "" }, parentId: undefined });
    const taxon2 = createTaxon({ id: "", name: { S: "" }, parentId: undefined });
    hierarchy.add(taxon1);
    hierarchy.add(taxon2);
    expect(taxon1.id).toMatch(/^t.*/);
    expect(taxon2.id).toMatch(/^t.*/);
    expect(Array.from(hierarchy.allItems).length).toBe(2);
    expect(hierarchy.itemWithId(taxon1.id)).toBe(taxon1);
    expect(hierarchy.itemWithId(taxon2.id)).toBe(taxon2);
});

test("Get top level items", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    const taxon1 = createTaxon({ id: "1", name: { S: "" }, parentId: undefined });
    const taxon2 = createTaxon({ id: "2", name: { S: "" }, parentId: "1" });
    const taxon3 = createTaxon({ id: "3", name: { S: "" }, parentId: "1" });
    hierarchy.add(taxon1);
    hierarchy.add(taxon2);
    hierarchy.add(taxon3);
    expect(Array.from(hierarchy.topLevelItems)).toStrictEqual([taxon1]);
});

test("Get children", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    const taxon1 = createTaxon({ id: "1", name: { S: "" }, parentId: undefined });
    const taxon2 = createTaxon({ id: "2", name: { S: "" }, parentId: "1" });
    const taxon3 = createTaxon({ id: "3", name: { S: "" }, parentId: "1" });
    const taxon4 = createTaxon({ id: "4", name: { S: "" }, parentId: undefined });
    const taxon5 = createTaxon({ id: "5", name: { S: "" }, parentId: "4" });
    const taxon6 = createTaxon({ id: "6", name: { S: "" }, parentId: "2" });
    hierarchy.add(taxon1);
    hierarchy.add(taxon2);
    hierarchy.add(taxon3);
    hierarchy.add(taxon4);
    hierarchy.add(taxon5);
    hierarchy.add(taxon6);
    expect(hierarchy.hasChildren(taxon1)).toBe(true);
    expect(hierarchy.hasChildren(taxon2)).toBe(true);
    expect(hierarchy.hasChildren(taxon3)).toBe(false);
    expect(hierarchy.hasChildren(taxon4)).toBe(true);
    expect(hierarchy.hasChildren(taxon5)).toBe(false);
    expect(hierarchy.hasChildren(taxon6)).toBe(false);
    expect(Array.from(hierarchy.childrenOf(taxon1))).toStrictEqual([taxon2, taxon3]);
    expect(Array.from(hierarchy.childrenOf(taxon2))).toStrictEqual([taxon6]);
    expect(Array.from(hierarchy.childrenOf(taxon4))).toStrictEqual([taxon5]);
});

test("Top level order", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    hierarchy.add(createTaxon({ id: "1", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "2", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "3", name: { S: "" }, parentId: undefined }));
    expect(Array.from(hierarchy.topLevelItems).map(h => h.id)).toStrictEqual(["1", "2", "3"]);

    hierarchy.moveUp(hierarchy.itemWithId("3")!);
    expect(Array.from(hierarchy.topLevelItems).map(h => h.id)).toStrictEqual(["1", "3", "2"]);
    hierarchy.moveUp(hierarchy.itemWithId("3")!);
    expect(Array.from(hierarchy.topLevelItems).map(h => h.id)).toStrictEqual(["3", "1", "2"]);
    hierarchy.moveUp(hierarchy.itemWithId("3")!);
    expect(Array.from(hierarchy.topLevelItems).map(h => h.id)).toStrictEqual(["3", "1", "2"]);
    hierarchy.moveDown(hierarchy.itemWithId("1")!);
    expect(Array.from(hierarchy.topLevelItems).map(h => h.id)).toStrictEqual(["3", "2", "1"]);
    hierarchy.moveDown(hierarchy.itemWithId("1")!);
    expect(Array.from(hierarchy.topLevelItems).map(h => h.id)).toStrictEqual(["3", "2", "1"]);
});

test("Item level order", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    const t = createTaxon({ id: "4", name: { S: "" }, parentId: "1" });
    hierarchy.add(createTaxon({ id: "1", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "2", name: { S: "" }, parentId: "1" }));
    hierarchy.add(createTaxon({ id: "3", name: { S: "" }, parentId: "1" }));
    hierarchy.add(createTaxon(t));
    hierarchy.add(createTaxon({ id: "5", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "6", name: { S: "" }, parentId: "5" }));
    hierarchy.moveUp(t);
    hierarchy.moveUp(t);
    expect(Array.from(hierarchy.allItems).map(h => h.id)).toStrictEqual(["1", "4", "2", "3", "5", "6"]);
    hierarchy.moveUp(hierarchy.itemWithId("2")!);
    expect(Array.from(hierarchy.allItems).map(h => h.id)).toStrictEqual(["1", "2", "4", "3", "5", "6"]);
    hierarchy.moveUp(hierarchy.itemWithId("2")!);
    expect(Array.from(hierarchy.allItems).map(h => h.id)).toStrictEqual(["1", "2", "4", "3", "5", "6"]);
});

test("Extract hierarchy", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    const taxon1 = createTaxon({ id: "1", name: { S: "A" }, parentId: undefined });
    const taxon2 = createTaxon({ id: "2", name: { S: "B" }, parentId: "1" });
    const taxon3 = createTaxon({ id: "3", name: { S: "C" }, parentId: "1" });
    const taxon4 = createTaxon({ id: "4", name: { S: "D" }, parentId: "1" });
    const taxon5 = createTaxon({ id: "5", name: { S: "E" }, parentId: undefined });
    const taxon6 = createTaxon({ id: "6", name: { S: "F" }, parentId: "5" });
    hierarchy.add(taxon1);
    hierarchy.add(taxon2);
    hierarchy.add(taxon3);
    hierarchy.add(taxon4);
    hierarchy.add(taxon5);
    hierarchy.add(taxon6);

    const subHierarchy1 = hierarchy.extractHierarchy(hierarchy.itemWithId("1")!);
    const subHierarchy5 = hierarchy.extractHierarchy(hierarchy.itemWithId("5")!);

    expect(Array.from(subHierarchy1.allItems).map(t => t.name)).toStrictEqual(["A", "B", "C", "D"]);
    const topLevelItems = Array.from(subHierarchy1.topLevelItems);
    expect(topLevelItems.length).toBe(1);
    expect(topLevelItems[0].name).toBe("A");
    expect(topLevelItems[0]).not.toBe(hierarchy.itemWithId("1"));
    const children = Array.from(subHierarchy1.childrenOf(topLevelItems[0]));
    expect(children.map(c => c.name)).toStrictEqual(["B", "C", "D"]);

    expect(Array.from(subHierarchy5.allItems).map(t => t.name)).toStrictEqual(["E", "F"]);
});

test("Add hierarchy", () => {
    const hierarchy1 = new Hierarchy<Taxon>("t", new Map());
    hierarchy1.add(createTaxon({ id: "1", name: { S: "A" }, parentId: undefined }));
    hierarchy1.add(createTaxon({ id: "2", name: { S: "B" }, parentId: "1" }));
    hierarchy1.add(createTaxon({ id: "3", name: { S: "C" }, parentId: "1" }));

    const hierarchy2 = new Hierarchy<Taxon>("t", new Map());
    hierarchy2.add(createTaxon({ id: "1", name: { S: "D" }, parentId: undefined }));
    hierarchy2.add(createTaxon({ id: "2", name: { S: "E" }, parentId: "1" }));
    hierarchy2.add(createTaxon({ id: "3", name: { S: "F" }, parentId: "1" }));

    const hierarchy3 = new Hierarchy<Taxon>("t", new Map());
    hierarchy3.add(createTaxon({ id: "1", name: { S: "G" }, parentId: undefined }));
    hierarchy3.add(createTaxon({ id: "2", name: { S: "H" }, parentId: "1" }));
    hierarchy3.add(createTaxon({ id: "3", name: { S: "I" }, parentId: "1" }));

    hierarchy2.addHierarchy(hierarchy1, undefined);
    hierarchy3.addHierarchy(hierarchy1, "2");

    expect(Array.from(hierarchy1.allItems).length).toBe(3);
    expect(Array.from(hierarchy2.allItems).length).toBe(6);
    expect(Array.from(hierarchy3.allItems).length).toBe(6);

    expect(Array.from(hierarchy2.topLevelItems).length).toBe(2);
    expect(Array.from(hierarchy3.topLevelItems).length).toBe(1);

    expect(Array.from(hierarchy2.allItems).map(t => t.name)).toStrictEqual(["D", "E", "F", "A", "B", "C"]);
    expect(Array.from(hierarchy3.allItems).map(t => t.name)).toStrictEqual(["G", "H", "A", "B", "C", "I"]);
    const childrenOf2 = Array.from(hierarchy3.childrenOf(hierarchy3.itemWithId("2")));
    expect(childrenOf2.map(t => t.name)).toStrictEqual(["A"]);
    expect(Array.from(hierarchy3.childrenOf(childrenOf2[0])).map(t => t.name)).toStrictEqual(["B", "C"]);
});

test("Parents of", () => {
    const hierarchy = new Hierarchy<Taxon>("t", new Map());
    const taxon1 = createTaxon({ id: "1", name: { S: "" }, parentId: undefined }) 
    const taxon2 = createTaxon({ id: "2", name: { S: "" }, parentId: "1" }); 
    const taxon3 = createTaxon({ id: "3", name: { S: "" }, parentId: "2" }); 
    const taxon4 = createTaxon({ id: "4", name: { S: "" }, parentId: "2" });
    const taxon5 = createTaxon({ id: "5", name: { S: "" }, parentId: "1" }); 
    hierarchy.add(taxon1);
    hierarchy.add(taxon2);
    hierarchy.add(taxon3);
    hierarchy.add(taxon4);
    hierarchy.add(taxon5);

    expect(hierarchy.parentsOf(taxon1)).toStrictEqual([]);
    expect(hierarchy.parentsOf(taxon2)).toStrictEqual([taxon1]);
    expect(hierarchy.parentsOf(taxon3)).toStrictEqual([taxon1, taxon2]);
    expect(hierarchy.parentsOf(taxon4)).toStrictEqual([taxon1, taxon2]);
    expect(hierarchy.parentsOf(taxon5)).toStrictEqual([taxon1]);
});

test("Get ordered children tree", () => {
    const hierarchy = new Hierarchy<Taxon>("t", new Map());
    hierarchy.add(createTaxon({ id: "1", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "2", name: { S: "" }, parentId: "1" }));
    hierarchy.add(createTaxon({ id: "3", name: { S: "" }, parentId: "2" }));
    hierarchy.add(createTaxon({ id: "4", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "5", name: { S: "" }, parentId: "4" }));
    hierarchy.add(createTaxon({ id: "6", name: { S: "" }, parentId: "4" }));

    const childrenTree1 = Array.from(hierarchy.getOrderedChildrenTree(hierarchy.itemWithId("1")));
    expect(childrenTree1.map(t => t.id)).toStrictEqual(["1", "2", "3"]);

    const childrenTree2 = Array.from(hierarchy.getOrderedChildrenTree(hierarchy.itemWithId("2")));
    expect(childrenTree2.map(t => t.id)).toStrictEqual(["2", "3"]);
    
    const childrenTree4 = Array.from(hierarchy.getOrderedChildrenTree(hierarchy.itemWithId("4")));
    expect(childrenTree4.map(t => t.id)).toStrictEqual(["4", "5", "6"]);
});

test("Get leaves", () => {
    const hierarchy = new Hierarchy<Taxon>("t", new Map());
    hierarchy.add(createTaxon({ id: "1", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "2", name: { S: "" }, parentId: "1" }));
    hierarchy.add(createTaxon({ id: "3", name: { S: "" }, parentId: "2" }));
    hierarchy.add(createTaxon({ id: "4", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "5", name: { S: "" }, parentId: "4" }));
    hierarchy.add(createTaxon({ id: "6", name: { S: "" }, parentId: "4" }));

    const leaves1 = Array.from(hierarchy.getLeaves(hierarchy.itemWithId("1")));
    expect(leaves1.map(t => t.id)).toStrictEqual(["3"]);

    const leaves4 = Array.from(hierarchy.getLeaves(hierarchy.itemWithId("4")));
    expect(leaves4.map(t => t.id)).toStrictEqual(["5", "6"]);
});

test("Remove items", () => {
    const hierarchy = new Hierarchy<Taxon>("t", new Map());
    hierarchy.add(createTaxon({ id: "1", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "2", name: { S: "" }, parentId: "1" }));
    hierarchy.add(createTaxon({ id: "3", name: { S: "" }, parentId: "2" }));
    hierarchy.add(createTaxon({ id: "4", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "5", name: { S: "" }, parentId: "4" }));
    hierarchy.add(createTaxon({ id: "6", name: { S: "" }, parentId: "4" }));

    hierarchy.remove(hierarchy.itemWithId("6")!);
    expect(Array.from(hierarchy.allItems).map(t => t.id)).toStrictEqual(["1", "2", "3", "4", "5"]);
    expect(Array.from(hierarchy.childrenOf(hierarchy.itemWithId("4"))).map(t => t.id)).toStrictEqual(["5"]);

    hierarchy.remove(hierarchy.itemWithId("1")!);
    expect(Array.from(hierarchy.allItems).map(t => t.id)).toStrictEqual(["4", "5"]);
});

test("Clear", () => {
    const hierarchy = new Hierarchy<Taxon>("t", new Map());
    hierarchy.add(createTaxon({ id: "1", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "2", name: { S: "" }, parentId: undefined }));
    hierarchy.add(createTaxon({ id: "3", name: { S: "" }, parentId: "2" }));
    hierarchy.clear();

    expect(Array.from(hierarchy.allItems)).toStrictEqual([]);
});