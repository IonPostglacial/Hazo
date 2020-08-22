import type * as sdd from "./libs/SDD";

declare global {
    interface Window {
        sdd: {
            Loader: typeof sdd.sdd_Loader;
            Saver: typeof sdd.sdd_Saver;
        }
    }
}