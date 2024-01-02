import { Config } from "@/tools/config";
import { AnyItem, Picture } from "./types";
import { pathToItem } from "./Dataset";
import makeid from "@/tools/makeid";


export function normalizePicture(pic: { id: string, path: string[], url: string, label: string, hubUrl: string|undefined } ): Picture {
    const pict = { ...pic, type: "picture" as const };
    if (pict.id.startsWith("http")) {
        pict.id = "m-" + makeid(16);
    }
    while (Array.isArray(pict.url)) {
        pict.url = pict.url[0];
    }
    if (!pict.hubUrl?.startsWith(Config.datasetRegistry)) {
        pict.hubUrl = undefined;
    }
    if (pict.url?.startsWith(Config.datasetRegistry)) {
        pict.hubUrl = pict.url;
    }
    return pict;
}

export function picturesFromPhotos(item: AnyItem, photos: string[] | Picture[]): Picture[] {
    if (photos.length === 0 || typeof photos[0] !== "string") {
        return (photos as Picture[]).map(normalizePicture);
    }
    return (photos as string[]).map(url => (normalizePicture({ id: "m-" + makeid(16), path: pathToItem(item), url: url, label: url, hubUrl: undefined })));
}

export async function uploadPicture(photoUrl: string) {
    if (photoUrl.startsWith(Config.datasetRegistry)) {
        return photoUrl;
    } else {
        const res = await fetch(Config.datasetRegistry + "api/upload-img", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "file-url=" + encodeURIComponent(photoUrl),
        });
        if (res.ok) {
            const json = await res.json();
            if (json.status === "ok") {
                return Config.datasetRegistry + encodeURI(json.url);
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }
}