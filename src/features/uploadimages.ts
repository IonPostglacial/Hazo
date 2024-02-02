import { uploadPicture } from "@/datatypes";

export type UploadResponse = {
    src: string,
    response: string|undefined,
};

export function uploadPictures(urls: string[], onprogress: (progress: number) => void) {
    let progress = 0;
    return Promise.allSettled(urls.map(src =>
        uploadPicture(src).then((response): UploadResponse => {
            progress += 1;
            onprogress(progress);
            return { src, response };
        })
    ));
}