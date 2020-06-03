const DB_NAME = "Datasets";
const DB_VERSION = 1;

function createStore(db) {
    if (!db.objectStoreNames.contains("Datasets")) {
        db.createObjectStore("Datasets", { keyPath: "id" });
    }
}

function dbStore(dataset) {
    const rq = Object.assign(indexedDB.open(DB_NAME, DB_VERSION), {
        onupgradeneeded() {
            createStore(rq.result);
        },
        onerror() {
            alert("Impossible to store data on your browser.");
        },
        onsuccess() {
            const db = rq.result;

            const transaction = db.transaction("Datasets", "readwrite");
            
            transaction.oncomplete = function () {
                // TODO: Handle success, error
                console.log(`Write to dataset #${dataset.id} successful`);
            };
        
            const datasets = transaction.objectStore("Datasets");

            datasets.put(dataset); // TODO: Handle success, error
        },
    });
}

function dbList() {
    return new Promise(function (resolve, reject) {
        const rq = Object.assign(indexedDB.open(DB_NAME, DB_VERSION), {
            onupgradeneeded() {
                createStore(rq.result);
            },
            onsuccess() {
                const db = rq.result;

                const transaction = db.transaction("Datasets", "readonly");
                
                transaction.oncomplete = function () {
                    // TODO: Handle success, error
                    console.log("Listing datasets successful");
                };
            
                const datasets = transaction.objectStore("Datasets");

                const list = Object.assign(datasets.getAllKeys(), {
                    onsuccess() {
                        resolve(list.result);
                    },
                    onerror() {
                        console.log("Listing datasets failed.");
                        reject(rq.result);
                    }
                });
            },
            onerror() {
                reject(rq.result);
            }
        });
    });
}

function dbLoad(id) {
    return new Promise(function (resolve, reject) {
        const rq = Object.assign(indexedDB.open(DB_NAME, DB_VERSION), {
            onupgradeneeded() {
                createStore(rq.result);
            },
            onsuccess() {
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
            },
            onerror() {
                reject(rq.result);
            }
        });
    });
}

export default {
    store: dbStore,
    list: dbList,
    load: dbLoad,
}