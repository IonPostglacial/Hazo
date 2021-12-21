import { DictionaryEntry } from "./datatypes";
import { EncodedDataset } from "./features/codec";

const DB_NAME = "Datasets";
const DB_VERSION = 6;

function createStore(db: IDBDatabase) {
    if (!db.objectStoreNames.contains("Datasets")) {
        db.createObjectStore("Datasets", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("DictionaryEntries")) {
        db.createObjectStore("DictionaryEntries", { keyPath: "id" });
    }
}

export function addDictionaryEntry(entry: DictionaryEntry): Promise<void> {
    return new Promise((resolve, reject) => {
        const rq = indexedDB.open(DB_NAME, DB_VERSION);
    
        rq.onupgradeneeded = function (event) {
            onUpgrade(rq.result, event.oldVersion);
        };
        rq.onerror = function () {
            alert("Impossible to store data on your browser.");
            reject();
        };
        rq.onsuccess = function () {
            const db = rq.result;
    
            const transaction = db.transaction("DictionaryEntries", "readwrite");
            
            transaction.oncomplete = function () {
                // TODO: Handle success, error
                console.log(`Write of dictionary entry #${entry.id} successful`);
            };
        
            const entries = transaction.objectStore("DictionaryEntries");
    
            entries.put(entry);
            resolve();
        };
    });
}

export function getAllDictionaryEntries(): Promise<DictionaryEntry[]> {
    return new Promise(function (resolve, reject) {
        const rq = indexedDB.open(DB_NAME, DB_VERSION);
        rq.onupgradeneeded = function (event) {
            onUpgrade(rq.result, event.oldVersion);
        };
        rq.onsuccess = function () {
            const db = rq.result;

            const transaction = db.transaction("DictionaryEntries", "readonly");
            
            transaction.oncomplete = function () {
                // TODO: Handle success, error
                console.log("Listing dictionary entries successful");
            };
        
            const datasets = transaction.objectStore("DictionaryEntries");

            const list = datasets.getAll(), result:DictionaryEntry[] = [];
            list.onsuccess = function () {
                for (const entry of list.result) {
                    result.push(entry);
                }
                resolve(result);
            };
            list.onerror = function () {
                console.log("Listing dictionary entries failed.");
                reject(rq.result);
            };
        };
        rq.onerror = function () {
            reject(rq.result);
        };
    });
}

export function deleteDictionaryEntry(id: string) {
    const rq = indexedDB.open(DB_NAME, DB_VERSION);
    rq.onupgradeneeded = function (event) {
        onUpgrade(rq.result, event.oldVersion);
    };
    rq.onsuccess = function () {
        const db = rq.result;

        const transaction = db.transaction("DictionaryEntries", "readwrite");

        transaction.oncomplete = function () {
            // TODO: Handle success, error
            console.log(`Deletion of dictionary entry #${id} successful`);
        };

        const datasets = transaction.objectStore("DictionaryEntries");

        datasets.delete(id);
    }
}

async function onUpgrade(db: IDBDatabase, oldVersion: number) {
    createStore(db);
}

function dbStore(dataset: EncodedDataset): Promise<void> {
    return new Promise((resolve, reject) => {
        const rq = indexedDB.open(DB_NAME, DB_VERSION);
    
        rq.onupgradeneeded = function (event) {
            onUpgrade(rq.result, event.oldVersion);
        };
        rq.onerror = function () {
            alert("Impossible to store data on your browser.");
            reject();
        };
        rq.onsuccess = function () {
            const db = rq.result;
    
            const transaction = db.transaction("Datasets", "readwrite");
            
            transaction.oncomplete = function () {
                // TODO: Handle success, error
                console.log(`Write to dataset #${dataset.id} successful`);
            };
        
            const datasets = transaction.objectStore("Datasets");
    
            datasets.put(dataset);
            resolve();
        };
    });
}

function dbList(): Promise<string[]> {
    return new Promise(function (resolve, reject) {
        const rq = indexedDB.open(DB_NAME, DB_VERSION);
        rq.onupgradeneeded = function (event) {
            onUpgrade(rq.result, event.oldVersion);
        };
        rq.onsuccess = function () {
            const db = rq.result;

            const transaction = db.transaction("Datasets", "readonly");
            
            transaction.oncomplete = function () {
                // TODO: Handle success, error
                console.log("Listing datasets successful");
            };
        
            const datasets = transaction.objectStore("Datasets");

            const list = datasets.getAllKeys(), result:string[] = [];
            list.onsuccess = function () {
                for (const key of list.result) {
                    if (typeof key === "string") {
                        result.push(key);
                    }
                }
                resolve(result);
            };
            list.onerror = function () {
                console.log("Listing datasets failed.");
                reject(rq.result);
            };
        };
        rq.onerror = function () {
            reject(rq.result);
        };
    });
}

function dbDelete(id: string) {
    const rq = indexedDB.open(DB_NAME, DB_VERSION);
    rq.onupgradeneeded = function (event) {
        onUpgrade(rq.result, event.oldVersion);
    };
    rq.onsuccess = function () {
        const db = rq.result;

        const transaction = db.transaction("Datasets", "readwrite");

        transaction.oncomplete = function () {
            // TODO: Handle success, error
            console.log(`Deletion of dataset #${id} successful`);
        };

        const datasets = transaction.objectStore("Datasets");

        datasets.delete(id);
    }
}

function dbLoad(id: string): Promise<EncodedDataset> {
    return new Promise(function (resolve, reject) {
        const rq = indexedDB.open(DB_NAME, DB_VERSION);
        rq.onupgradeneeded = function (event) {
            onUpgrade(rq.result, event.oldVersion);
        };
        rq.onsuccess = function () {
            const db = rq.result;

            const transaction = db.transaction("Datasets", "readonly");
            
            transaction.oncomplete = function () {
                // TODO: Handle success, error
                console.log(`Read from dataset #${id} successful`);
            };
        
            const datasets = transaction.objectStore("Datasets");

            const read = Object.assign(datasets.get(id), {
                onsuccess() {
                    resolve(read.result);
                },
                onerror() {
                    console.log(`Read from dataset #${id} failed`);
                    reject(read.result);
                }
            });
        };
        rq.onerror = function () {
            reject(rq.result);
        };
    });
}

export default {
    store: dbStore,
    list: dbList,
    load: dbLoad,
    delete: dbDelete,
}