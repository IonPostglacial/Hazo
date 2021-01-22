import { Taxon } from "../datatypes/Taxon";
import { Hierarchy } from "../datatypes/hierarchy";

test("Empty hierarchy", () => {
    const hierarchy = new Hierarchy("", new Map());
    const object = hierarchy.toObject();
    expect(Array.from(hierarchy.allItems).length).toBe(0);
    expect(Object.keys(object).length).toBe(0);
});

test("Addition of items with ids", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    const taxon1 = new Taxon({ id: "1", name: "", parentId: undefined, childrenIds: [] });
    const taxon2 = new Taxon({ id: "2", name: "", parentId: undefined, childrenIds: [] });
    const taxon1b = new Taxon({ id: "1", name: "b", parentId: undefined, childrenIds: [] });
    hierarchy.add(taxon1);
    hierarchy.add(taxon2);
    expect(hierarchy.itemWithId("1")).toBe(taxon1);
    expect(hierarchy.itemWithId("2")).toBe(taxon2);
    hierarchy.add(taxon1b);
    expect(hierarchy.itemWithId("1")).toBe(taxon1b);
    expect(Array.from(hierarchy.allItems).length).toBe(2);
});

test("Addition of items without ids", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    const taxon1 = new Taxon({ id: "", name: "", parentId: undefined, childrenIds: [] });
    const taxon2 = new Taxon({ id: "", name: "", parentId: undefined, childrenIds: [] });
    hierarchy.add(taxon1);
    hierarchy.add(taxon2);
    expect(Array.from(hierarchy.allItems).length).toBe(2);
    expect(hierarchy.itemWithId(taxon1.id)).toBe(taxon1);
    expect(hierarchy.itemWithId(taxon2.id)).toBe(taxon2);
});

test("Top level order", () => {
    const hierarchy = new Hierarchy<Taxon>("", new Map());
    hierarchy.add(new Taxon({ id: "1", name: "", parentId: undefined, childrenIds: [] }));
    hierarchy.add(new Taxon({ id: "2", name: "", parentId: undefined, childrenIds: [] }));
    hierarchy.add(new Taxon({ id: "3", name: "", parentId: undefined, childrenIds: [] }));
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
    hierarchy.add(new Taxon({ id: "1", name: "", parentId: undefined, childrenIds: ["4", "2", "3"] }));
    hierarchy.add(new Taxon({ id: "2", name: "", parentId: "1", childrenIds: [] }));
    hierarchy.add(new Taxon({ id: "3", name: "", parentId: "1", childrenIds: [] }));
    hierarchy.add(new Taxon({ id: "4", name: "", parentId: "1", childrenIds: [] }));
    expect(Array.from(hierarchy.allItems).map(h => h.id)).toStrictEqual(["1", "4", "2", "3"]);
    hierarchy.moveUp(hierarchy.itemWithId("2")!);
    expect(Array.from(hierarchy.allItems).map(h => h.id)).toStrictEqual(["1", "2", "4", "3"]);
    hierarchy.moveUp(hierarchy.itemWithId("2")!);
    expect(Array.from(hierarchy.allItems).map(h => h.id)).toStrictEqual(["1", "2", "4", "3"]);
});