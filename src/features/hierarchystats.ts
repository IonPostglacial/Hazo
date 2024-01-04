import { Taxon } from "@/datatypes";
import { useDatasetStore } from "@/stores/dataset";

export type Counts = {
    families: Taxon[],
    gender: number,
    taxa: Taxon[],
    species: Taxon[],
};

// 1er lvl famille si enfants
// 2ème genre si enfants
// taxon ceux qui n'ont pas d'enfants
// espèce: taxons qui ont un auteur

export function taxonsStats(taxons: Iterable<Taxon>): Counts {
    console.log("stats");
    const store = useDatasetStore();
    const counts: Counts = { families: [], gender: 0, taxa: [], species: [] };
    for (const taxon of taxons) {
        console.log("analyze taxon", taxon);
        if (store.hasChildren(taxon)) {
            if (taxon.path.length === 1) {
                counts.families.push(taxon);
            } else {
                counts.gender++;
            }
        } else {
            counts.taxa.push(taxon)
            if (taxon.author) {
                counts.species.push(taxon);
            }
        }
    }
    return counts;
}