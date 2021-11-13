import { HierarchicalItem, Hierarchy, Taxon } from "@/datatypes";

type Counts = {
    families: number,
    gender: number,
    taxa: number,
    species: number,
};

// 1er lvl famille si enfants
// 2ème genre si enfants
// taxon ceux qui n'ont pas d'enfants
// espèce: taxons qui ont un auteur

export function taxonsStats(hierarchy: Hierarchy<Taxon>): Counts {
    const counts: Counts = { families: 0, gender: 0, taxa: 0, species: 0 };
    function countRec(item: Taxon, level: number) {
        if (hierarchy.hasChildren(item)) {
            if (level === 0) {
                counts.families++;
            } else {
                counts.gender++;
            }
        } else {
            counts.taxa++
            if (item.author) {
                counts.species++;
            }
        }
        for (const child of hierarchy.childrenOf(item)) {
            countRec(child, level + 1);
        }
    }
    for (const item of hierarchy.topLevelItems) {
        countRec(item, 0);
    }
    return counts;
}