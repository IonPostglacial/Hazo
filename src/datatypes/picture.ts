import { Config } from "@/tools/config";
import { Picture } from "./types";


export function normalizePicture(pic: { id: string, url: string, label: string, hubUrl: string|undefined } ): Picture {
    while (Array.isArray(pic.url)) {
        pic.url = pic.url[0];
    }
    if (!pic.hubUrl?.startsWith(Config.datasetRegistry)) {
        pic.hubUrl = undefined;
    }
    if (pic.url?.startsWith(Config.datasetRegistry)) {
        pic.hubUrl = pic.url;
    }
    return pic;
}

export function picturesFromPhotos(photos: string[] | Picture[]): Picture[] {
    if (photos.length === 0 || typeof photos[0] !== "string") {
        return (photos as Picture[]).map(normalizePicture);
    }
    return (photos as string[]).map(url => (normalizePicture({ id: url, url: url, label: url, hubUrl: undefined })));
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