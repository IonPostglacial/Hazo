import JSZip from "jszip";
import { generateFileName } from "./generatefilename";

interface HierarchyEntry {
	id: string;
	name: string;
	topLevel: boolean;
	children: Record<string, HierarchyEntry>;
}

function getEntries(hierarchy: Record<string, HierarchyEntry>, zip: JSZip, path = "") {
	for (const entry of Object.values(hierarchy)) {
		if (entry.topLevel || path !== "") {
			const entryName = generateFileName(entry.name);
			const currentPath = path + encodeURI(entryName) + "/";
			zip.folder(currentPath);
			getEntries(entry.children, zip, currentPath);
		}
	}
}

export function exportZipFolder(hierarchy: Record<string, HierarchyEntry>): Promise<Blob> {
	const zip = new JSZip();

	getEntries(hierarchy, zip);

	return zip.generateAsync({type:"blob"});
}
