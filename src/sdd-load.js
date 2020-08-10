function loadSddFile(file) {
    return new Promise(function (resolve, reject) {
        const fileReader = new FileReader();
        
        fileReader.onload = function () {
            const xml = new window.sdd.Loader(false).load(fileReader.result);
            resolve(xml);
        };
        fileReader.onerror = function () {
            reject(fileReader.error);
        };
        fileReader.readAsText(file);
    });
}

async function loadSDD(file, extraFields=[]) {
    if (typeof extraFields === "undefined") { extraFields = [] }

    const datasets = await loadSddFile(file);
    const dataset = window.bunga.Dataset.fromSdd(datasets[0], extraFields);
    
    return dataset;
}

export default loadSDD;