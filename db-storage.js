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
                    console.log("write successful");
                };
            
                const datasets = transaction.objectStore("Datasets");

                datasets.add(dataset); // TODO: Handle success, error
            },
        });
    }

    function dbLoad() {
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
                        console.log("read successful");
                    };
                
                    const datasets = transaction.objectStore("Datasets");
    
                    const read = datasets.get(0); // TODO: Handle success, error
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
        load: dbLoad,
    }
}());