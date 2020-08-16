import type * as sdd from "./libs/SDD";

declare global {
    interface Window {
        sdd: {
            Loader: typeof sdd.sdd_Loader;
            Saver: typeof sdd.sdd_Saver;
        },
        bunga: {
            DetailData: typeof sdd.bunga_DetailData;
            Hierarchy: typeof sdd.bunga_Hierarchy;
            Book: typeof sdd.bunga_Book;
            Dataset: typeof sdd.bunga_Dataset;
            Character: typeof sdd.bunga_Character;
            TaxonToTex: typeof sdd.bunga_TaxonToTex;
            ImageCache: typeof sdd.bunga_ImageCache;
            DetailHighlighter: typeof sdd.bunga_DetailHighlighter;
            Codec: typeof sdd.bunga_Codec;
        }
    }
}