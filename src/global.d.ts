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
            Book: typeof sdd.bunga_Book;
            Character: typeof sdd.bunga_Character;
            Taxon: typeof sdd.bunga_Taxon;
            State: typeof sdd.bunga_State;
            ImageCache: typeof sdd.bunga_ImageCache;
            Item: typeof sdd.bunga_Item;
            HierarchicalItem: typeof sdd.bunga_HierarchicalItem;
        }
    }
}