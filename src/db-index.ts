const DB_VERSION = 2;
const DB_NAME = "NamesIndex";
const FAMILY_INDEX_STORE_NAME = "FamilyIndexStore";
export type Language = "S" | "V" | "CN" | "LA";
const LANGUAGES_V1: Language[] = ["S", "V", "CN"];
export const LANGUAGES: Language[] = LANGUAGES_V1;
export type Name = Record<Language | string, string>;

function createFamilyIndexStore(db: IDBDatabase, e: IDBVersionChangeEvent) {
    console.log("previous", e.oldVersion);
    if (!db.objectStoreNames.contains(FAMILY_INDEX_STORE_NAME)) {
        console.log("ga");
        const store = db.createObjectStore(FAMILY_INDEX_STORE_NAME, { keyPath: "id", autoIncrement: true });
        for (const langProp of LANGUAGES) {
            store.createIndex(langProp, langProp, { unique: false });
        }
    }
    if (e.oldVersion < 2) {
        const request = e.target;
        if (request === null || !("transaction" in request) || !(request.transaction instanceof IDBTransaction)) return;
        const tx = request.transaction;
        const store = tx.objectStore(FAMILY_INDEX_STORE_NAME);
        store.createIndex("LA", "LA", { unique: false });
    }
}

function onUpgrade(db: IDBDatabase, e: IDBVersionChangeEvent) {
    createFamilyIndexStore(db, e);
}

function openNamesDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const rq = indexedDB.open(DB_NAME, DB_VERSION);
        rq.onupgradeneeded = function (event) {
            onUpgrade(rq.result, event);
        };
        rq.onerror = function () {
            alert("Impossible to store names index on your browser.");
            reject();
        };
        rq.onsuccess = function () {
            resolve(rq.result);
        };
    });
}

async function familyIndexStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await openNamesDatabase();
    return db.transaction(FAMILY_INDEX_STORE_NAME, mode).objectStore(FAMILY_INDEX_STORE_NAME);
}

export async function storefamily(family: Name): Promise<IDBRequest<IDBValidKey>> {
    return familyIndexStore("readwrite").then(store => 
        store.put(Object.fromEntries(Object.entries(family)
            .map(([k, v]) => [k, v.toLowerCase()]))));
}

export async function deleteFamily(id: string): Promise<IDBRequest<undefined>> {
    return familyIndexStore("readwrite").then(store => store.delete(id));
}

export async function familiesWithNamesLike(propName: Language, prefix: string): Promise<Name[]> {
    const search = prefix.toLowerCase();
    const store = await familyIndexStore("readonly");
    return new Promise((resolve, reject) => {
        var result: Name[] = [];
        const cur = store.index(propName).openCursor(IDBKeyRange.bound(search, search + "\uffff"), "next")
        cur.onsuccess = function () {
            var cursor = this.result;
            if (cursor) {
                result.push(cursor.value);
                cursor.continue();
            } else {
                resolve(result);
            }
        };
        cur.onerror = function () {
            reject(this.error);
        }
    });
}