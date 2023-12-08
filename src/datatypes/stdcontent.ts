import { getMapsDirectory, loadText, storeText } from "@/fs-storage";
import { Book, Character, Field, GeoMap } from "./types";
import { Config } from "@/tools/config";

export const standardBooks: Book[] = [
    {id: "fmc", label: "Flore de Madagascar et Comores"},
    {id: "mbf", label: "Manuel de Botanique Forestière"},
];

export const standardFields: Field[] = [
    {std: true, id: "name2", label: "Syn", icon: ""},
    {std: true, id: "vernacularName", label: "NV", icon: ""},
    {std: true, id: "vernacularName2", label: "NV2", icon: ""},
    {std: true, id: "meaning", label: "Sense", icon: ""},
    {std: true, id: "noHerbier", label: "N° Herbier", icon: ""},
    {std: true, id: "herbariumPicture", label: "Herbarium Picture", icon: ""},
    {std: true, id: "website", label: "Website", icon: ""},
];

export const standardMaps: GeoMap[] = [
    { name: "Mada admin 1", fileName: "MDG_adm1.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_1" },
    { name: "Mada admin 2", fileName: "MDG_adm2.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_2" },
    { name: "Mada admin 3", fileName: "MDG_adm3.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_3" },
    { name: "Mada admin 4", fileName: "MDG_adm4.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_4" },
];

export async function loadGeoJson(mapName: string) {
    const dir = await getMapsDirectory();
    let geoJson: any;
    try {
        const text = await loadText(dir, mapName);
        geoJson = JSON.parse(text);
    } catch {
        try {
            const geoFile = await fetch(`${Config.siteUrl}${mapName}`);
            geoJson = await geoFile.json();
            storeText(dir, mapName, JSON.stringify(geoJson));
        } catch (e) {
            console.error(`error while loading map "${mapName}":`, e);
        }
    }
    return geoJson;
}

export function getCharacterMap(character: Character): GeoMap|undefined {
    return standardMaps.find(m => m.name === character.name.S);
}