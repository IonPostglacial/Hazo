import JSZip from "jszip";

export async function importKml(file: File|undefined): Promise<{ lat: number, lng: number }[]> {
    if (typeof file === "undefined") return [];

    const zip = await JSZip.loadAsync(file);
    const kmlContent = await zip.file("doc.kml")?.async("string");

    if (typeof kmlContent === "undefined") return [];

    const kmlDom = new DOMParser().parseFromString(kmlContent, "text/xml");
    
    return Array.from(kmlDom.getElementsByTagName("coordinates")).map(function(coordElement) {
        const components = coordElement.innerHTML.split(",");
        return { lat: parseFloat(components[1]), lng: parseFloat(components[0]) };
    });
}