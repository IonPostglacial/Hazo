import JSZip from "jszip";
import { Hierarchy, Taxon } from "@/datatypes";
import generateFileName from "./generatefilename";


async function fillZipEntry(hierarchy: Hierarchy<Taxon>, entries: Iterable<Taxon>, zip: JSZip, path = "") {
	for (const entry of entries) {
		const entryName = generateFileName(entry.name.S);
		const currentPath = path + encodeURI(entryName) + "/";
		zip.folder(currentPath);
		const futurePictures: Array<Promise<Response>> = [];
		const paths: string[] = [];
		for (const [i, pic] of entry.pictures.entries()) {
			if (pic.hubUrl) {
				const url = pic.hubUrl;
				const parts = url.split("/");
				let fileName = parts[parts.length - 1];
				const fParts = fileName.split(".");
				let extension = fParts.length > 1 ? fParts[fParts.length - 1] : undefined;
				if (!extension) {
					extension = "jpeg";
				}
				const path = `${currentPath}${entryName}_${i+1}.${extension}`;
				paths.push(path);
				futurePictures.push(fetch(url));
			}
		}
		const pics = await Promise.allSettled(futurePictures.values());
		const futureBlobs: Promise<Blob>[] = pics.map((p: any) => p.value.blob());
		const blobs = await Promise.allSettled(futureBlobs);

		for (let i = 0; i < paths.length; i++) {
			const blobResult = blobs[i];
			if (blobResult.status === "fulfilled") {
				zip.file(paths[i], blobResult.value);
			} else {
				console.warn(`downloading picture for '${paths[i]}' failed.`);
			}
		}
		await fillZipEntry(hierarchy, entry.children, zip, currentPath);
	}
}

export async function exportZipFolder(hierarchy: Hierarchy<Taxon>): Promise<Blob> {
	const zip = new JSZip();

	await fillZipEntry(hierarchy, hierarchy.children, zip);

	return zip.generateAsync({type:"blob"});
}
