import { load as dbLoad, list as dbList } from "./db-storage";
import { store as fsStore } from "./fs-storage";

export async function migrateIndexedDbStorageToFileStorage() {
    if (localStorage.getItem("idb-migrated") === "true") {
        return;
    }
    const datasetList = await dbList();
    const awaits: Promise<string>[] = [];
    for (const dsId of datasetList) {
        const ds = await dbLoad(dsId);
        awaits.push(fsStore(ds));
    }
    await Promise.allSettled(awaits);
    localStorage.setItem("idb-migrated", "true");
}