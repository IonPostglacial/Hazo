window.addEventListener("load", main);

function main() {
    const defaultData = {
        selectedItem: 0,
        selectedDescription: 0,
        selectedTab: 0,
        tabs: [
            "Items",
            "Descriptors"
        ],
        items: {},
        itemsHierarchy: {},
        flatItemsHierarchy: {},
        descriptions: {},
        descriptionsHierarchy: {},
        flatDescriptionsHierarchy: {}
    };
    const savedData = JSON.parse(localStorage.getItem("data")) ?? defaultData;

    var app = new Vue({
        el: '#app',
        data: savedData,
        methods: {
            addItem(parentId) {
                const newItemName = document.getElementById("new-item");
                const newItemId = "myt-" + Object.keys(this.items).length;
                
                Vue.set(this.items, newItemId, { id: newItemId, name: newItemName.value, photo: "" });
                const newItem = { entry: this.items[newItemId], children: {}, open: false };
                if (typeof parentId !== "undefined") {
                    Vue.set(this.flatItemsHierarchy[parentId].children, newItemId, newItem);
                } else {
                    Vue.set(this.itemsHierarchy, newItemId, newItem);
                }
                newItemName.value = "";
            },
            addDescription(parentId) {
                const newDescriptionName = document.getElementById("new-description");
                const newDescriptionId = "myd-" + Object.keys(this.descriptions).length;
                Vue.set(this.descriptions, newDescriptionId, {
                    id: newDescriptionId,
                    name: newDescriptionName.value,
                    states: []
                });
                const newDescription = {
                    entry: this.descriptions[newDescriptionId],
                    children: {},
                    open: false
                };
                if(typeof parentId !== "undefined") {
                    Vue.set(this.flatDescriptionsHierarchy[parentId].children, newDescriptionId, newDescription);
                } else {
                    Vue.set(this.descriptionsHierarchy, newDescriptionId, newDescription);
                }
                newDescriptionName.value = "";
            },
            addState(description, event) {
                description.states.push({
                    name: event.currentTarget.previousSibling.previousSibling.value
                });
            },
            saveData() {
                localStorage.setItem("data", JSON.stringify(this.$data));
            },
            resetData() {
                Vue.set(this.$data, "tabs", defaultData.tabs);
                Vue.set(this.$data, "items", defaultData.items);
                Vue.set(this.$data, "itemsHierarchy", defaultData.itemsHierarchy);
                Vue.set(this.$data, "descriptions", defaultData.descriptions);
                Vue.set(this.$data, "descriptionsHierarchy", defaultData.descriptionsHierarchy);
            },
            importData() {
                const dataImport = document.getElementById("import-data");

                dataImport.click();
            },
            fileUpload(e) {
                const file = e.target.files[0];

                (async () => {
                    const {
                        items, itemsHierarchy, flatItemsHierarchy,
                        descriptors, descriptorsHierarchy, flatDescriptorsHierarchy
                    } = await SDD.load(file);
                    Vue.set(this.$data, "items", items);
                    Vue.set(this.$data, "itemsHierarchy", itemsHierarchy);
                    Vue.set(this.$data, "flatItemsHierarchy", flatItemsHierarchy);
                    Vue.set(this.$data, "descriptions", descriptors);
                    Vue.set(this.$data, "descriptionsHierarchy", descriptorsHierarchy);
                    Vue.set(this.$data, "flatDescriptionsHierarchy", flatDescriptorsHierarchy);
                })();
            },
            exportData() {

            }
        }
    });
}