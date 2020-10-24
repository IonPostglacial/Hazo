import JSZip from "jszip";
import { Taxon } from "../datatypes";
import { Hierarchy } from "../hierarchy";
import generateFileName from "./generatefilename";


function getEntries(hierarchy: Hierarchy<Taxon>, entries: Iterable<Taxon>, zip: JSZip, path = "") {
	for (const entry of entries) {
		const entryName = generateFileName(entry.name);
		const currentPath = path + encodeURI(entryName) + "/";
		zip.folder(currentPath);
		getEntries(hierarchy, hierarchy.childrenOf(entry), zip, currentPath);
	}
}

export function exportZipFolder(hierarchy: Hierarchy<Taxon>): Promise<Blob> {
	const zip = new JSZip();

	getEntries(hierarchy, hierarchy.topLevelItems, zip);

	return zip.generateAsync({type:"blob"});
}
