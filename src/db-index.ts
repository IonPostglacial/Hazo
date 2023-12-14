const DB_VERSION = 5;
const DB_NAME = "NamesIndex";
const FAMILY_INDEX_STORE_NAME = "FamilyIndexStore";
const CHARACTER_INDEX_STORE_NAME = "CharacterIndexStore";
const STATES_INDEX_STORE_NAME = "StateIndexStore";
export type Language = "S" | "V" | "CN" | "LA" | "FR" | "EN";
const LANGUAGES_V1: Language[] = ["S", "V", "CN"];
const LANGUAGES_V5: Language[] = LANGUAGES_V1.concat(["FR", "EN"])
export const LANGUAGES: Language[] = LANGUAGES_V5;
export type Name = Record<Language | string, string>;
export type Completion = { id: string | number | symbol | undefined, values: Name };

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
    if (e.oldVersion < 5) {
        const request = e.target;
        if (request === null || !("transaction" in request) || !(request.transaction instanceof IDBTransaction)) return;
        const tx = request.transaction;
        const store = tx.objectStore(storeName);
        store.createIndex("FR", "FR", { unique: false });
        store.createIndex("EN", "EN", { unique: false });
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
    namesLike(prefix: string): Promise<Completion[]>;
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
    
    private async namesLikeProperty(propName: Language, prefix: string): Promise<Completion[]> {
        const search = prefix.toLowerCase();
        const store = await indexStore(this.storeName, "readonly");
        return new Promise((resolve, reject) => {
            const result: Completion[] = [];
            const cur = store.index(propName).openCursor(IDBKeyRange.bound(search, search + "\uffff"), "next")
            cur.onsuccess = function () {
                const cursor = this.result;
                if (cursor) {
                    result.push({ id: cursor.key as string, values: cursor.value});
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

    async namesLike(prefix: string): Promise<Completion[]> {
        return [...new Map((await Promise.all(LANGUAGES.map(lang => this.namesLikeProperty(lang, prefix)))).flat().map(c => [c.id, c])).values()];
    }
}

export const familyNameStore = new IndexStore(FAMILY_INDEX_STORE_NAME);
export const characterNameStore = new IndexStore(CHARACTER_INDEX_STORE_NAME);
export const stateNameStore = new IndexStore(STATES_INDEX_STORE_NAME);