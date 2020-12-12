import { EncodedDataset } from "./features/codec";

const DB_NAME = "Datasets";
const DB_VERSION = 5;

function createStore(db: IDBDatabase) {
    if (!db.objectStoreNames.contains("Datasets")) {
        db.createObjectStore("Datasets", { keyPath: "id" });
    }
}

async function onUpgrade(db: IDBDatabase, oldVersion: number) {
    createStore(db);
}

function dbStore(dataset: EncodedDataset) {
    const rq = indexedDB.open(DB_NAME, DB_VERSION);
    
    rq.onupgradeneeded = function (event) {
        onUpgrade(rq.result, event.oldVersion);
    };
    rq.onerror = function () {
        alert("Impossible to store data on your browser.");
    };
    rq.onsuccess = function () {
        const db = rq.result;

        const transaction = db.transaction("Datasets", "readwrite");
        
        transaction.oncomplete = function () {
            // TODO: Handle success, error
            console.log(`Write to dataset #${dataset.id} successful`);
        };
    
        const datasets = transaction.objectStore("Datasets");

        datasets.put(dataset); // TODO: Handle success, error
    };
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
}