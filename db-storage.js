(function () { "use strict";
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
                onerror() {
                    alert("Impossible to store data on your browser.");
                },
                onsuccess() {
                    const db = rq.result;
    
                    const transaction = db.transaction("Datasets", "readonly");
                    
                    transaction.oncomplete = function () {
                        // TODO: Handle success, error
                        console.log("read dataset successful");
                    };
                
                    const datasets = transaction.objectStore("Datasets");
    
                    const list = datasets.getAllKeys(); // TODO: Handle success, error
                    list.onsuccess = function () {
                        resolve(list.result);
                    };
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
                onerror() {
                    alert("Impossible to store data on your browser.");
                },
                onsuccess() {
                    const db = rq.result;
    
                    const transaction = db.transaction("Datasets", "readonly");
                    
                    transaction.oncomplete = function () {
                        // TODO: Handle success, error
                        console.log(`Read from dataset #${id} successful`);
                    };
                
                    const datasets = transaction.objectStore("Datasets");
    
                    const read = datasets.get(id); // TODO: Handle success, error
                    read.onsuccess = function () {
                        resolve(read.result);
                    };
                },
                onerror() {
                    reject(rq.result);
                }
            });
        });
    }

    window.DB = {
        store: dbStore,
        list: dbList,
        load: dbLoad,
    }
}());