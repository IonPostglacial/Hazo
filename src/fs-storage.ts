import { EncodedDataset } from "./features";


async function getDatasetsDirectory(): Promise<FileSystemDirectoryHandle> {
    const globalDir: FileSystemDirectoryHandle = await navigator.storage.getDirectory();
    return globalDir.getDirectoryHandle("datasets", { create: true });
}

export function datasetFromFile(id: string, file: File): Promise<EncodedDataset> {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
            if (typeof fileReader.result === "string") {
                if (fileReader.result) {
                    const db = JSON.parse(fileReader.result);
                    resolve(db);
                } else {
                    resolve({ id, taxons: [], characters: [], states: [], books: [], extraFields: [] });
                }
            }
        };
        fileReader.onerror = function () {
            reject(fileReader.error);
        }
        fileReader.readAsText(file);
    });
}

export function fileNameFromDatasetId(id: string): string {
    return `${id}.hazo.json`;
}

export async function store(dataset: EncodedDataset): Promise<void> {
    const dir = await getDatasetsDirectory();
    const handle = await dir.getFileHandle(fileNameFromDatasetId(dataset.id), { create: true });
    const file = await handle.createWritable({ keepExistingData: false });
    const json = JSON.stringify(dataset);
    await file.write(json);
    return await file.close();
}

export async function list(): Promise<string[]> {
    const dir = await getDatasetsDirectory();
    const files = [];
    
    for await (const [n, _] of dir.entries()) {
        const [base, ..._] = n.split(".");
        files.push(base);   
    }
    return files;
}

export async function load(id: string): Promise<EncodedDataset> {
    const dir = await getDatasetsDirectory();
    const handle = await dir.getFileHandle(fileNameFromDatasetId(id), { create: true });
    const file = await handle.getFile();
    return datasetFromFile(id, file);
}

export async function remove(id: string) {
    const dir = await getDatasetsDirectory();
    return dir.removeEntry(id);
}

export async function removeAll() {
    const l = await list();
    for (const d of l) {
        await remove(fileNameFromDatasetId(d));
    }
}