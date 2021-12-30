import JSZip from "jszip";
import { Hierarchy, Taxon } from "@/datatypes";
import generateFileName from "./generatefilename";


function getEntries(hierarchy: Hierarchy<Taxon>, entries: Iterable<Taxon>, zip: JSZip, path = "") {
	for (const entry of entries) {
		const entryName = generateFileName(entry.name.S);
		const currentPath = path + encodeURI(entryName) + "/";
		zip.folder(currentPath);
		getEntries(hierarchy, entry.children, zip, currentPath);
	}
}

export function exportZipFolder(hierarchy: Hierarchy<Taxon>): Promise<Blob> {
	const zip = new JSZip();

	getEntries(hierarchy, hierarchy.children, zip);

	return zip.generateAsync({type:"blob"});
}
