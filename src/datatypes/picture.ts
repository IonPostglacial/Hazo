import { Picture } from "./types";


export function picturesFromPhotos(photos: string[]|Picture[]): Picture[] {
    if (photos.length === 0 || typeof photos[0] !== "string") {
        return photos as Picture[];
    }
    return (photos as string[]).map(url => ({ id: url, url: url, label: url }));
}