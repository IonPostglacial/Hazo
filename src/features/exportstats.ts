import { Dataset, iterHierarchy } from "@/datatypes";


export default function exportStatistics(ds: Dataset): string {
    const references = [];
    const div = document.createElement("div");
    const startsWithLetter = /^[^\W\d_]+.*/;
    for (const item of iterHierarchy(ds.taxonsHierarchy)) {
        div.innerHTML = item.detail;
        const words = div.innerText.split(/[\s\t,;:=/."'-()]/) ?? [];
        for (const word of words) {
            const trimmedWord = word.trim();
            if (startsWithLetter.test(trimmedWord)) {
                references.push({ word: trimmedWord, origin: item.id });
            }
        }
    }
    let csv = "\uFEFFword,origin\n";
    for (const { word, origin } of references) {
        let escapedWord = word;
        if (escapedWord.includes(",") || escapedWord.includes("\n")) {
            escapedWord = escapedWord.replace('"', '""');
            escapedWord = `"${escapedWord}"`;
        }
        csv += escapedWord + "," + origin + "\n";
    }
    return csv;
}