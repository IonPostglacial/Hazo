import { Taxon } from "../datatypes";

function escape(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function highlightTaxonsDetails(text: string, taxons: Record<string, Taxon>) {
    const wordsToHighlight: string[] = [];

    const lines = text.split("\n");
    for (const line of lines) {
        const words = line.split(",");
        for (const word of words) {
            wordsToHighlight.push(word.trim());
        }
    }

    const reTxt = wordsToHighlight.map(word => escape(word)).join("|");
    const re = new RegExp(`([^\\w<>]|^|<p>)(${reTxt})([^\\w<>]|$|</p>)`, "g");
    for (const taxon of Object.values(taxons)) {
        taxon.detail = taxon.detail.replace(re, "$1<b>$2</b>$3");
    }
}