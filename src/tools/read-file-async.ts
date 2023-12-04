export function readTextFileAsync(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
            if (typeof fileReader.result === "string") {
                resolve(fileReader.result)
            } else {
                reject("not text");
            }
        };
        fileReader.onerror = function () {
            reject(fileReader.error);
        }
        fileReader.readAsText(file);
    });
}