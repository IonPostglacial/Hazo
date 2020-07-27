function loadSddFile(file) {
    return new Promise(function (resolve, reject) {
        const fileReader = Object.assign(new FileReader(), {
            onload() {
                const xml = new window.sdd.Loader(false).load(fileReader.result);
                resolve(xml);
            },
            onerror() {
                reject(fileReader.error);
            },
        });
        fileReader.readAsText(file);
    });
}

async function loadSDD(file, extraFields=[]) {
    if (typeof extraFields === "undefined") { extraFields = [] }

    const datasets = await loadSddFile(file);
    const dataset = window.bunga.Dataset.fromSdd(datasets[0], extraFields);

    for (const item of Object.values(dataset.items)) {
        for (const [name, value] of Object.entries(item.extra)) {
            item["extra-" + name] = value;
        }    
    }
    
    return dataset;
}

export default loadSDD;