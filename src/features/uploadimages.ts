import { uploadPicture } from "@/datatypes";

export async function uploadPictures(urls: string[], onprogress: (progress: number) => void) {
    let progress = 0;
    return Promise.allSettled(urls.map(async (url) => {
        await uploadPicture(url);
        progress += 1;
        onprogress(progress);
    }));
}