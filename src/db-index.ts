const DB_VERSION = 4;
const DB_NAME = "NamesIndex";
const FAMILY_INDEX_STORE_NAME = "FamilyIndexStore";
const CHARACTER_INDEX_STORE_NAME = "CharacterIndexStore";
const STATES_INDEX_STORE_NAME = "StateIndexStore";
export type Language = "S" | "V" | "CN" | "LA";
const LANGUAGES_V1: Language[] = ["S", "V", "CN"];
export const LANGUAGES: Language[] = LANGUAGES_V1;
export type Name = Record<Language | string, string>;

function createIndexStore(db: IDBDatabase, storeName: string, e: IDBVersionChangeEvent) {
    if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
        for (const langProp of LANGUAGES) {
            store.createIndex(langProp, langProp, { unique: false });
        }
    }
    if (e.oldVersion < 2) {
        const request = e.target;
        if (request === null || !("transaction" in request) || !(request.transaction instanceof IDBTransaction)) return;
        const tx = request.transaction;
        const store = tx.objectStore(storeName);
        store.createIndex("LA", "LA", { unique: false });
    }
}

function onUpgrade(db: IDBDatabase, e: IDBVersionChangeEvent) {
    createIndexStore(db, FAMILY_INDEX_STORE_NAME, e);
    createIndexStore(db, CHARACTER_INDEX_STORE_NAME, e);
    createIndexStore(db, STATES_INDEX_STORE_NAME, e);
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

async function indexStore(storeName: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
    const db = await openNamesDatabase();
    return db.transaction(storeName, mode).objectStore(storeName);
}

export interface NameStore {
    store(name: Name): Promise<void>;
    delete(id: string): Promise<void>;
    namesLike(propName: Language, prefix: string): Promise<Name[]>;
}

class IndexStore implements NameStore {
    private storeName: string;

    constructor(storeName: string) {
        this.storeName = storeName;
    }

    async store(name: Name): Promise<void> {
        indexStore(this.storeName, "readwrite").then(store => 
            store.put(Object.fromEntries(Object.entries(name)
                .map(([k, v]) => [k, v?.toLowerCase() ?? ""]))));
    }
    
    async delete(id: string): Promise<void> {
        indexStore(this.storeName, "readwrite").then(store => store.delete(id));
    }
    
    async namesLike(propName: Language, prefix: string): Promise<Name[]> {
        const search = prefix.toLowerCase();
        const store = await indexStore(this.storeName, "readonly");
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
}

export const familyNameStore = new IndexStore(FAMILY_INDEX_STORE_NAME);
export const characterNameStore = new IndexStore(CHARACTER_INDEX_STORE_NAME);
export const stateNameStore = new IndexStore(STATES_INDEX_STORE_NAME);