import { EncodedDataset } from "./features";
import { readTextFileAsync } from "./tools/read-file-async";


async function getDatasetsDirectory(): Promise<FileSystemDirectoryHandle> {
    const globalDir: FileSystemDirectoryHandle = await navigator.storage.getDirectory();
    return globalDir.getDirectoryHandle("datasets", { create: true });
}

export async function getMapsDirectory(): Promise<FileSystemDirectoryHandle> {
    const globalDir: FileSystemDirectoryHandle = await navigator.storage.getDirectory();
    return globalDir.getDirectoryHandle("maps", { create: true });
}

export function fileNameFromDatasetId(id: string): string {
    return `${id}.hazo.json`;
}

export async function storeText(dir: FileSystemDirectoryHandle, fileName: string, text: string): Promise<string> {
    const handle = await dir.getFileHandle(fileName, { create: true });
    const file = await handle.createWritable({ keepExistingData: false });
    await file.write(text);
    await file.close();
    return fileName;
}

export async function loadText(dir: FileSystemDirectoryHandle, fileName: string): Promise<string> {
    const handle = await dir.getFileHandle(fileName, { create: true });
    const file = await handle.getFile();
    return readTextFileAsync(file);
}

export async function store(dataset: EncodedDataset): Promise<string> {
    const dir = await getDatasetsDirectory();
    const fileName = fileNameFromDatasetId(dataset.id);
    await storeText(dir, fileName, JSON.stringify(dataset));
    return fileName;
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
    const fileName = fileNameFromDatasetId(id);
    try {
        return JSON.parse(await loadText(dir, fileName));
    } catch {
        return { id, taxons: [], characters: [], states: [], books: [], extraFields: [] };
    }
}

export async function remove(id: string) {
    const dir = await getDatasetsDirectory();
    return dir.removeEntry(fileNameFromDatasetId(id));
}

export async function removeAll() {
    const l = await list();
    for (const d of l) {
        await remove(fileNameFromDatasetId(d));
    }
}