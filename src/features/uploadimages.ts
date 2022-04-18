import { uploadPicture } from "@/datatypes";

export function uploadPictures(urls: string[], onprogress: (progress: number) => void) {
    let progress = 0;
    return Promise.allSettled(urls.map(url =>
        uploadPicture(url).then(res => {
            progress += 1;
            onprogress(progress);
            return res;
        })
    ));
}