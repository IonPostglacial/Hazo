import { Picture } from "./types";

const DB_NAME = "Pictures";
const BITMAP_STORE = "Bitmaps";
const VECTOR_STORE = "SVGs";
const DB_VERSION = 1;

export type PictureType = "bitmap" | "vector" | "none";

function getPictureType(picture: Picture): PictureType {
    if (picture.url === "") {
        return "none";
    } else if (picture.url.endsWith("svg")) {
        return "vector";
    } else {
        return "bitmap";
    }
}

async function downloadPictureContent(picture: Picture, type: PictureType): Promise<Blob|string|undefined> {
    if (type === "none") return;

    const image = await fetch(picture.url, { mode: "cors" });

    if (type === "bitmap") {
        return image.blob();
    } else {
        return image.text();
    }
}

export async function getPictureContent(picture: Picture): Promise<Blob|string|undefined> {
    const type = getPictureType(picture);
    if (type !== "none" && typeof picture.content === "undefined") {
        picture.content = await downloadPictureContent(picture, type);
        // TODO: in case of failure, try to retrieve the content from the database.
    }
    return picture.content;
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

function getPictureDbStoreName(type: PictureType): string {
    if (type === "vector") {
        return VECTOR_STORE;
    } else {
        return BITMAP_STORE;
    }
}

export function storePictureToDatabase(picture: Picture) {
    const type = getPictureType(picture);

    if (type === "none") return;

    const rq = indexedDB.open(DB_NAME, DB_VERSION);

    rq.onupgradeneeded = (event) => {
        onUpgrade(rq.result, event.oldVersion);
    };
    rq.onerror = () => {
        alert("Impossible to store data on your browser.");
    };
    rq.onsuccess = async () => {
        const db = rq.result;
        const storeName = getPictureDbStoreName(type);

        const transaction = db.transaction(storeName, "readwrite");
        
        transaction.oncomplete = () => {
            console.log(`Writing of picture '#${picture.id}' to ${storeName} successful`);
        };
        const store = transaction.objectStore(storeName);

        store.put(await getPictureContent(picture));
    };
}