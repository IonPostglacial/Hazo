import type * as sdd from "./libs/SDD";

declare global {
    interface Window {
        sdd: {
            Loader: typeof sdd.sdd_Loader;
            Saver: typeof sdd.sdd_Saver;
        },
        bunga: {
            Field: typeof sdd.bunga_Field;
            DetailData: typeof sdd.bunga_DetailData;
            Hierarchy: typeof sdd.bunga_Hierarchy;
            Book: typeof sdd.bunga_Book;
            Dataset: typeof sdd.bunga_Dataset;
            Character: typeof sdd.bunga_Character;
            Taxon: typeof sdd.bunga_Taxon;
            TaxonToTex: typeof sdd.bunga_TaxonToTex;
            ImageCache: typeof sdd.bunga_ImageCache;
            Item: typeof sdd.bunga_Item;
            HierarchicalItem: typeof sdd.bunga_HierarchicalItem;
        }
    }
}