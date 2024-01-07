const DB_VERSION = 1;
const DB_NAME = "WordsIndex";
const FAMILY_INDEX_STORE_NAME = "FamilyIndexStore";
const CHARACTER_INDEX_STORE_NAME = "CharacterIndexStore";
const STATES_INDEX_STORE_NAME = "StateIndexStore";
export type Language = "S" | "V" | "CN" | "FR" | "EN";
const LANGUAGES_V1: Language[] = ["S", "V", "EN", "FR", "CN"];
export const LANGUAGES: Language[] = LANGUAGES_V1;
export type Name = Record<Language | string, string>;
export type IndexInput = { name: Record<Language, string>, origin: string, img: string|undefined };
export type IndexEntryWithoutImage = Record<Language, string> & { origin: string, words: string[] };
export type IndexEntryWithImg = IndexEntryWithoutImage & { img: string };
export type IndexEntry = IndexEntryWithoutImage | IndexEntryWithImg;
export type Completion = IndexEntry;

export function validateIndexEntry(entry: unknown): entry is IndexEntry {
    if (typeof entry === "object" && entry !== null && 
        "origin" in entry && typeof entry.origin === "string" &&
        "words" in entry && Array.isArray(entry.words) &&
        "S" in entry && typeof entry.S === "string") {
            return true;
        } else {
            return false;
        }
}

function processIndexInput(input: IndexInput): IndexEntry {
    const names = Object.entries(input.name).map(([k, v]) => [k, v ?? ""]);
    const words = names
        .flatMap(([_, name]) => {
            if (typeof name !== "string") {
                return [];
            }
            return name.split(/[\s,/;.]+/)
                .filter(s => s !== "" && s !== " ")
                .map(s => s.toLowerCase())
        });
    return { ...Object.fromEntries(names), words, origin: input.origin, img: input.img };
}

function createIndexStore(db: IDBDatabase, storeName: string, _e: IDBVersionChangeEvent) {
    if (!db.objectStoreNames.contains(storeName)) {
        const store = db.createObjectStore(storeName, { keyPath: LANGUAGES });
        store.createIndex("words", "words", { multiEntry: true, unique: false });
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

export interface WordStore {
    store(name: IndexInput): Promise<void>;
    delete(id: string): Promise<void>;
    namesLike(prefix: string): Promise<Completion[]>;
}

class IndexStore implements WordStore {
    private storeName: string;

    constructor(storeName: string) {
        this.storeName = storeName;
    }

    async store(input: IndexInput): Promise<void> {
        const store = await indexStore(this.storeName, "readwrite");
        const entry = processIndexInput(input);
        try {
            store.put(entry);
        } catch(e) {
            console.error(`error inserting entry '${JSON.stringify(entry)}'`);
            console.error(e);
        }
    }
    
    async delete(id: string): Promise<void> {
        indexStore(this.storeName, "readwrite").then(store => store.delete(id));
    }
    
    async namesLike(prefix: string): Promise<Completion[]> {
        const search = prefix.toLowerCase();
        const store = await indexStore(this.storeName, "readonly");
        return new Promise((resolve, reject) => {
            const result = new Map<string, Completion>();
            const cur = store.index("words").openCursor(IDBKeyRange.bound(search, search + "\uffff"), "next")
            cur.onsuccess = function () {
                const cursor = this.result;
                if (cursor) {
                    const value: unknown = cursor.value;
                    if (validateIndexEntry(value)) {
                        result.set(""+cursor.primaryKey, value);
                    }
                    cursor.continue();
                } else {
                    resolve([...result.values()]);
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