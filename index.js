window.addEventListener("load", main);

function main() {
    const defaultData = {
        selectedItem: 0,
        selectedDescription: [],
        selectedTab: 0,
        tabs: [
            "Items",
            "Descriptions"
        ],
        items: {},
        itemsHierarchy: {},
        descriptions: []
    };
    const savedData = JSON.parse(localStorage.getItem("data")) ?? defaultData;
    Vue.component("tree-menu", {
        props: ["name", "items", "onAdd"],
        methods: {
            addItem() {
                this.$emit('add-item');
            }
        },
        template: `
            <ul>
                <li v-for="item, index in items">
                    <label>
                        <input type="radio" :value="index" :name="name" v-on:input="$emit('input', $event.target.value)" />
                        {{ item.entry.name }}
                        <slot></slot>
                    </label>
                    <tree-menu v-if="item?.children !== undefined && Object.keys(item.children).length > 0"
                        :name="name"
                        :items="item.children"
                        v-on="$listeners">
                    </tree-menu>
                </li>
                <li>
                    <input type="text" :id="'new-' + name" />
                    <button v-on:click="addItem" class="background-color-1">
                        Add
                    </button>
                </li>
            </ul>
        `
    });

    var app = new Vue({
        el: '#app',
        data: savedData,
        methods: {
            addItem() {
                const newItemName = document.getElementById('new-item');
                const newItemId = "myt-" + Object.keys(this.items).length;
                Vue.set(this.items, newItemId, { name: newItemName.value, photo: '' });
                Vue.set(this.itemsHierarchy, newItemId, { entry: this.items[newItemId], children: {} });
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
            resetData() {
                Vue.set(this.$data, "items", defaultData.items);
                Vue.set(this.$data, "itemsHierarchy", defaultData.itemsHierarchy);
                Vue.set(this.$data, "descriptions", defaultData.descriptions);
            },
            importData() {
                const dataImport = document.getElementById("import-data");

                dataImport.click();
            },
            fileUpload(e) {
                const file = e.target.files[0];

                (async () => {
                    const items = {};
                    const itemsHierarchy = {};
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
                            const id = taxonName.getAttribute("id");
                            const label = taxonName.getElementsByTagName("Label")[0];
                            const detail = taxonName.getElementsByTagName("Detail")[0];
                            const mediaObject = taxonName.getElementsByTagName("MediaObject")[0];
                            
                            items[id] = {
                                name: label.textContent,
                                detail: detail.textContent,
                                photo: imagesById.get(mediaObject?.getAttribute("ref"))
                            };
                        }

                        const taxonHierarchies = dataset.getElementsByTagName("TaxonHierarchies")[0];
                        const taxonNameByHierarchyId = new Map();

                        for (const taxonHierarchy of taxonHierarchies.getElementsByTagName("TaxonHierarchy")) {
                            const nodes = taxonHierarchy.getElementsByTagName("Nodes")[0];

                            for (const node of nodes.getElementsByTagName("Node")) {
                                const taxonName = node.getElementsByTagName("TaxonName")[0];
                                const parent = node.getElementsByTagName("Parent");

                                taxonNameByHierarchyId.set(node.getAttribute("id"), taxonName.getAttribute("ref"));

                                const hierarchyItem = {
                                    entry: items[taxonName.getAttribute("ref")],
                                    children: {}
                                };
                                if (parent.length === 0) {
                                    console.log("lvl 0");
                                    itemsHierarchy[taxonName.getAttribute("ref")] = hierarchyItem;
                                } else {
                                    console.log("adopted");
                                    const parentTaxonId = taxonNameByHierarchyId.get(parent[0].getAttribute("ref"));
                                    itemsHierarchy[parentTaxonId].children[taxonName.getAttribute("ref")] = hierarchyItem;
                                }
                            }
                        }

                    }
                    Vue.set(this.$data, "items", items);
                    Vue.set(this.$data, "itemsHierarchy", itemsHierarchy);
                })();
            },
            exportData() {

            }
        }
    });
}