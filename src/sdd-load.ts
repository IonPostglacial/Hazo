import type { sdd_Dataset, bunga_Dataset, bunga_Field as Field } from "./libs/SDD";

function loadSddFile(file: File): Promise<sdd_Dataset[]> {
    return new Promise(function (resolve, reject) {
        const fileReader = new FileReader();
        
        fileReader.onload = function () {
            if (typeof fileReader.result === "string") {
                const xml = new window.sdd.Loader(false).load(fileReader.result);
                resolve(xml);
            }
        };
        fileReader.onerror = function () {
            reject(fileReader.error);
        };
        fileReader.readAsText(file);
    });
}

export async function loadSDD(file: File, extraFields:Field[]=[]): Promise<bunga_Dataset> {
    if (typeof extraFields === "undefined") { extraFields = [] }

    const datasets = await loadSddFile(file);
    const dataset = window.bunga.Dataset.fromSdd(datasets[0], extraFields);
    
    return dataset;
}