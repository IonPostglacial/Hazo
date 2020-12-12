import { Picture } from "./datatypes";

const DB_NAME = "Pictures";
const BITMAP_STORE = "Bitmaps";
const VECTOR_STORE = "SVGs";
const DB_VERSION = 1;

export type PictureType = "bitmap" | "vector" | "none";

export class StorablePicture {
    #picture: Picture;
    #cache: string|Blob|undefined;

    get id() { return this.#picture.id; }
    get url() { return this.#picture.url; }
    get label() { return this.#picture.label; }

    constructor(picture: Picture) {
        this.#picture = picture;
    }

    get type() {
        if (this.url === "") {
            return "none";
        } else if (this.url.endsWith("svg")) {
            return "vector";
        } else {
            return "bitmap";
        }
    }

    get dbStoreName() {
        if (this.type === "vector") {
            return VECTOR_STORE;
        } else {
            return BITMAP_STORE;
        }
    }

    async downloadContent() {
        if (this.type === "none") return;

        const image = await fetch(this.url, { mode: "cors" });

        if (this.type === "bitmap") {
            this.#cache = await image.blob();
        } else {
            this.#cache = await image.text();
        }
    }

    async getContent() {
        if (this.type !== "none" && typeof this.#cache === "undefined") {
            await this.downloadContent();
        }
        return this.#cache;
    }

    storeContentToDatabase() {
        if (this.type === "none") return;

        const rq = indexedDB.open(DB_NAME, DB_VERSION);
    
        rq.onupgradeneeded = (event) => {
            onUpgrade(rq.result, event.oldVersion);
        };
        rq.onerror = () => {
            alert("Impossible to store data on your browser.");
        };
        rq.onsuccess = async () => {
            const db = rq.result;
            const storeName = this.dbStoreName;
    
            const transaction = db.transaction(this.dbStoreName, "readwrite");
            
            transaction.oncomplete = () => {
                console.log(`Writing of picture '#${this.url}' to ${this.dbStoreName} successful`);
            };
        
            const store = transaction.objectStore(storeName);

            store.put(await this.getContent());
        };
    }
}

export function picturesFromPhotos(photos: string[]|Picture[]): Picture[] {
    if (photos.length === 0 || typeof photos[0] !== "string") {
        return photos as Picture[];
    }
    return (photos as string[]).map(url => ({ id: url, url: url, label: url }));
}

function createStores(db: IDBDatabase) {
    if (!db.objectStoreNames.contains(BITMAP_STORE)) {
        db.createObjectStore(BITMAP_STORE, { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains(VECTOR_STORE)) {
        db.createObjectStore(VECTOR_STORE, { keyPath: "id" });
    }
}

async function onUpgrade(db: IDBDatabase, oldVersion: number) {
    createStores(db);
}