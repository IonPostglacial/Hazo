window.addEventListener("load", main);

function main() {
    const savedData = JSON.parse(localStorage.getItem("data")) ?? {
        selectedItem: 0,
        selectedDescription: [],
        selectedTab: 0,
        tabs: [
            "Items",
            "Descriptions"
        ],
        items: [],
        descriptions: []
    };
    Vue.component("item-list-entry", {
        props: ["name", "val"],
        template: `
            <li>
                <label>
                    <input type="radio" :value="val" :name="name" v-on:input="$emit('input', $event.target.value)" />
                    <slot></slot>
                </label>
            </li>
        `
    });

    var app = new Vue({
        el: '#app',
        data: savedData,
        methods: {
            addItem() {
                const newItemName = document.getElementById('new-item');
                this.items.push({ name: newItemName.value, photo: '' });
                newItemName.value = '';
            },
            addDescription() {
                this.descriptions.push({
                    name: document.getElementById('new-description').value,
                    states: []
                });
            },
            addState(description, event) {
                description.states.push({
                    name: event.currentTarget.previousSibling.previousSibling.value
                });
            },
            selectDescription(selectionPath) {
                this.selectedDescription = selectionPath;
            },
            getDescription(descriptionPath, descriptions = null, cursor = 0) {
                const path = descriptionPath[cursor];

                if (descriptions === null) descriptions = this.descriptions;

                if (descriptionPath.length - cursor < 2) {
                    return descriptions[path];
                } else {
                    return this.getDescription(descriptionPath, descriptions[path].children, cursor + 1);
                }
            },
            saveData() {
                localStorage.setItem("data", JSON.stringify(this.$data));
            },
            importData() {
                const dataImport = document.getElementById("import-data");

                dataImport.click();
            },
            fileUpload(e) {
                const file = e.target.files[0];

                (async () => {
                    const text = await file.text();
                    const node = new DOMParser().parseFromString(text, "text/xml").firstElementChild;

                    for (const dataset of node.getElementsByTagName("Dataset")) {
                        const imagesById = new Map();

                        const mediaObjects = dataset.getElementsByTagName("MediaObjects")[0];

                        for (const mediaObject of mediaObjects.getElementsByTagName("MediaObject")) {
                            if (mediaObject.getElementsByTagName("Type")[0].textContent !== "Image") { continue; }

                            imagesById.set(mediaObject.id, mediaObject.getElementsByTagName("Source")[0].getAttribute("href"));
                        }

                        const taxonNames = dataset.getElementsByTagName("TaxonNames")[0];

                        for (const taxonName of taxonNames.getElementsByTagName("TaxonName")) {
                            const representation = taxonName.getElementsByTagName("Representation")[0];
                            const label = taxonName.getElementsByTagName("Label")[0];
                            const detail = taxonName.getElementsByTagName("Detail")[0];
                            const mediaObject = taxonName.getElementsByTagName("MediaObject")[0];
                            
                            this.$data.items.push({
                                name: label.textContent,
                                detail: detail.textContent,
                                photo: imagesById.get(mediaObject?.getAttribute("ref"))
                            });
                        }
                    }
                })();
            },
            exportData() {

            }
        }
    });
}