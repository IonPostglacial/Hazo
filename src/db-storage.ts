import type { bunga_Dataset as Dataset } from "./libs/SDD";

const DB_NAME = "Datasets";
const DB_VERSION = 2;

function createStore(db: IDBDatabase) {
    if (!db.objectStoreNames.contains("Datasets")) {
        db.createObjectStore("Datasets", { keyPath: "id" });
    }
}

async function onUpgrade(db: IDBDatabase, oldVersion: number) {
    createStore(db);
    
    if (oldVersion === 1) {
        const datasetIds = await dbList();

        for (const datasetId of datasetIds) {
            const dataset: any = await dbLoad(datasetId);

            for (const t of Object.values(dataset.items)) {
                const taxon:any = t;
                const extraProperties = Object.keys(taxon).filter(k => k.startsWith("extra-"));
                if (typeof taxon.extra === "undefined") {
                    taxon.extra = {};
                }
                if (typeof taxon.bookInfoByIds === "undefined") {
                    taxon.bookInfoByIds = Object.fromEntries(window.bunga.Book.standard.map(
                        b => [b.id, {
                            fasc: b.id === "fmc" ? taxon.fasc : "",
                            page: b.id === "fmc" ? taxon.page : null,
                            detail: ""
                        }]
                    ));
                    delete taxon.fasc;
                    delete taxon.page;
                }
                for (const extraProp of extraProperties) {
                    const [,propName] = extraProp.split("-");
                    taxon.extra[propName] = taxon[extraProp];
                    delete taxon[extraProp];
                }
            }

            dbStore(dataset);
        }
    }
}

function dbStore(dataset: Dataset) {
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

function dbLoad(id: string): Promise<Dataset> {
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