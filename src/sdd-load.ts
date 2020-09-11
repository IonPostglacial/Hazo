import type { Dataset as sdd_Dataset } from "./sdd/datatypes";
import { Loader } from "./sdd/loader";
import { Dataset, Field } from "./bunga";

function loadSddFile(file: File): Promise<sdd_Dataset[]> {
    return new Promise(function (resolve, reject) {
        const fileReader = new FileReader();
        
        fileReader.onload = function () {
            if (typeof fileReader.result === "string") {
                const xml = new Loader(false).load(fileReader.result);
                resolve(xml);
            }
        };
        fileReader.onerror = function () {
            reject(fileReader.error);
        };
        fileReader.readAsText(file);
    });
}

export async function loadSDD(file: File, extraFields: Field[] = []): Promise<Dataset> {
    if (typeof extraFields === "undefined") { extraFields = [] }

    const datasets = await loadSddFile(file);
    const dataset = Dataset.fromSdd(datasets[0], extraFields);
    
    return dataset;
}