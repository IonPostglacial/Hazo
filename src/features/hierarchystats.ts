import { HierarchicalItem, Hierarchy, Taxon } from "@/datatypes";

type Counts = {
    families: Taxon[],
    gender: number,
    taxa: Taxon[],
    species: Taxon[],
};

// 1er lvl famille si enfants
// 2ème genre si enfants
// taxon ceux qui n'ont pas d'enfants
// espèce: taxons qui ont un auteur

export function taxonsStats(hierarchy: Hierarchy<Taxon>): Counts {
    const counts: Counts = { families: [], gender: 0, taxa: [], species: [] };
    function countRec(item: Taxon, level: number) {
        if (hierarchy.hasChildren(item)) {
            if (level === 0) {
                counts.families.push(item);
            } else {
                counts.gender++;
            }
        } else {
            counts.taxa.push(item)
            if (item.author) {
                counts.species.push(item);
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