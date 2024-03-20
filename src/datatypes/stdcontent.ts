import { getMapsDirectory, loadText, storeText } from "@/fs-storage";
import { Book, Character, Field, GeoMap, Unit } from "./types";
import { Config } from "@/tools/config";

export const standardPalette = ["#ff188b", "#ff1e43", "#ff7e42", "#fbf700", "#aada00", "#009f51", "#006c72", "#35276e", "#62367b", "#964087"];

export const standardBooks: Book[] = [
    { type: "book", id: "fmc", path: [], label: "Flore de Madagascar et Comores" },
    { type: "book", id: "mbf", path: [], label: "Manuel de Botanique Forestière" },
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

const kg: Unit = { name: { S: "kg" } };
const g: Unit = { name: { S: "g" }, base: { unit: kg, factor: 1000 } };
const m: Unit = { name: { S: "m" } };
const mm: Unit = { name: { S: "mm" }, base: { unit: m, factor: 1000 } };
const cm: Unit = { name: { S: "cm" }, base: { unit: m, factor: 100 } };
const km: Unit = { name: { S: "km" }, base: { unit: m, factor: 0.001 } };
const nbr: Unit = { name: { S: "nbr" } };

export const standardUnits = { kg, g, m, mm, cm, km, nbr };
export const standardUnitsList = Object.values(standardUnits);

export const mapModel: GeoMap = { name: "Madagascar", nameEN: "Madagascar", nameCN: "马达加斯加", fileName: "MDG_adm0.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_0" };

export const standardMaps: GeoMap[] = [
    { name: "Province", nameEN: "Province", nameCN: "州", fileName: "MDG_adm1.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_1" },
    { name: "Région", nameEN: "Region", nameCN: "地区", fileName: "MDG_adm2.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_2" },
    { name: "Districte",  nameEN: "District", nameCN: "区域", fileName: "MDG_adm3.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_3" },
    { name: "Commune",  nameEN: "City", nameCN: "城市", fileName: "MDG_adm4.json", center: [46.518367, -18.546564], scale: 2000, property: "NAME_4" },
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
    if (character.characterType === "discrete" && character.preset === "map") {
        return standardMaps.find(m => m.fileName === character.mapFile);
    }
    return undefined;
}