import { Picture } from "./datatypes";


export function picturesFromPhotos(photos: string[]|Picture[]): Picture[] {
    if (photos.length === 0 || typeof photos[0] !== "string") {
        return photos as Picture[];
    }
    return (photos as string[]).map(url => ({ id: url, url: url, label: url }));
}

export function pictureUrl(picture: Picture): string {
    return picture.url;
}