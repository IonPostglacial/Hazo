window.addEventListener("load", main);

function main() {
    function download(filename, text) {
        const element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
        element.setAttribute("download", filename);

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    function getDependencyTree(descriptors) {
        const dependencyTree = {};

        for (const description of Object.values(descriptors)) {
            const newEntry = {
                id: description.id,
                entry: description,
                topLevel: description.inapplicableStates.length === 0,
                open: true,
                children: dependencyTree[description.id]?.children ?? {},
            };
            dependencyTree[description.id] = newEntry;
            if (description.inapplicableStates.length > 0) {
                const parentDependency = descriptors[description.inapplicableStates[0].descriptorId];
                
                if (dependencyTree[description.inapplicableStates[0].descriptorId] === undefined) {
                    dependencyTree[description.inapplicableStates[0].descriptorId] = {
                        id: parentDependency.id,
                        entry: parentDependency,
                        topLevel: undefined,
                        open: true,
                        children: {}
                    }
                }
                dependencyTree[description.inapplicableStates[0].descriptorId].children[description.id] = newEntry;
            }
        }
        return dependencyTree;
    }

    const defaultData = {
        showLeftMenu: true,
        selectedItem: 0,
        selectedDescription: 0,
        selectedItemDescriptor: 0,
        itemDescriptorSearch: "",
        selectedTab: 0,
        tabs: [
            "Items",
            "Descriptors"
        ],
        items: {},
        itemsHierarchy: {},
        descriptions: {},
        descriptionsHierarchy: {},
    };
    const savedData = JSON.parse(localStorage.getItem("data")) ?? defaultData;

    var app = new Vue({
        el: '#app',
        data: savedData,
        computed: {
            selectedItemStates() {
                const states = [];

                for (const description of this.items[this.selectedItem].descriptions) {
                    for (const state of description.states) {
                        states.push(state);
                    }
                }

                return states;
            },
            selectedItemDescriptorTree() {
                const itemStatesIds = [];
                const selectedItemDescriptions = this.items[this.selectedItem].descriptions;
                const dependencyTree = getDependencyTree(selectedItemDescriptions.map(d => d.descriptor));
                for (const description of selectedItemDescriptions) {
                    for (const state of description.states) {
                        itemStatesIds.push(state.id);
                    }
                }
                for (const descriptor of Object.values(dependencyTree)) {
                    const descriptorStates = selectedItemDescriptions.find(d => d.descriptor.id === descriptor.entry.id).states;

                    if (descriptor.entry.inapplicableStates.some(s => itemStatesIds.findIndex(id => id === s.id) >= 0 )) {
                        descriptor.hidden = true;
                        console.log("hidden", descriptor.entry.name);
                    }

                    if (descriptorStates.length === 0) {
                        descriptor.warning = true;
                        descriptor.children = {};
                    }
                    Object.assign(descriptor.children, descriptorStates.map(s => ({ entry: s })));
                }
                return dependencyTree;
            },
            showItems() {
                return this.selectedTab == 0 && typeof this.items[this.selectedItem] !== "undefined";
            },
            showDescriptors() {
                return this.selectedTab == 1 && typeof this.descriptions[this.selectedDescription] !== "undefined";
            },
            descriptorsDependencyTree() {
                return getDependencyTree(this.descriptions);
            }
        },
        methods: {
            toggleLeftMenu() {
                this.showLeftMenu = !this.showLeftMenu;
            },
            openAll() {
                const hierarchy = this.selectedTab == 0 ? this.itemsHierarchy : this.descriptionsHierarchy;

                for (const entry of Object.values(hierarchy)) {
                    entry.open = true;
                }
            },
            closeAll() {
                const hierarchy = this.selectedTab == 0 ? this.itemsHierarchy : this.descriptionsHierarchy;

                for (const entry of Object.values(hierarchy)) {
                    entry.open = false;
                }                
            },
            addItem({ value, parentId }) {
                const newItemId = "myt-" + Object.keys(this.items).length;
                
                Vue.set(this.items, newItemId, { id: newItemId, name: value, photos: [] });
                const newItem = { entry: this.items[newItemId], topLevel: typeof parentId === "undefined", children: {}, open: false };
                if (typeof parentId !== "undefined") {
                    Vue.set(this.itemsHierarchy[parentId].children, newItemId, newItem);
                } else {
                    Vue.set(this.itemsHierarchy, newItemId, newItem);
                }
            },
            addItemState(e, state) {
                const selectedItem = this.items[this.selectedItem];
                const selectedDescription = selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptor);
                const stateIndex = selectedDescription.states.findIndex(s => s.id === state.id);

                if (e.target.checked) {
                    if (stateIndex < 0) {
                        selectedDescription.states.push(state);
                    }
                } else {
                    if (stateIndex >= 0) {
                        selectedDescription.states.splice(stateIndex, 1);
                    }
                }
            },
            addAllItemStates() {
                const selectedItem = this.items[this.selectedItem];
                const selectedDescription = selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptor);

                selectedDescription.states = [...this.descriptions[selectedDescription.descriptor.id].states];
            },
            removeAllItemStates() {
                const selectedItem = this.items[this.selectedItem];
                const selectedDescription = selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptor);

                selectedDescription.states = [];
            },
            deleteItem({ parentId, id, itemId }) {
                Vue.delete(this.items, itemId);
                Vue.delete(this.itemsHierarchy, id);
                if (typeof parentId !== "undefined") {
                    Vue.delete(this.itemsHierarchy[parentId].children, itemId);
                }
            },
            addDescription({ value, parentId }) {
                const newDescriptionId = "myd-" + Object.keys(this.descriptions).length;

                Vue.set(this.descriptions, newDescriptionId, {
                    id: newDescriptionId,
                    name: value,
                    states: []
                });
                const newDescription = {
                    entry: this.descriptions[newDescriptionId],
                    topLevel: typeof parentId === "undefined",
                    children: {},
                    open: false
                };
                if(typeof parentId !== "undefined") {
                    Vue.set(this.descriptionsHierarchy[parentId].children, newDescriptionId, newDescription);
                } else {
                    Vue.set(this.descriptionsHierarchy, newDescriptionId, newDescription);
                }
            },
            deleteDescription({ parentId, id, itemId }) {
                Vue.delete(this.descriptions, itemId);
                Vue.delete(this.descriptionsHierarchy, itemId);
                if (typeof parentId !== "undefined") {
                    Vue.delete(this.descriptionsHierarchy[parentId].children, itemId);
                }
            },
            addState(description, value) {
                description.states.push({
                    id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                    name: value
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
                        items, itemsHierarchy,
                        descriptors, descriptorsHierarchy
                    } = await SDD.load(file);
                    Vue.set(this.$data, "items", items);
                    Vue.set(this.$data, "itemsHierarchy", itemsHierarchy);
                    Vue.set(this.$data, "descriptions", descriptors);
                    Vue.set(this.$data, "descriptionsHierarchy", descriptorsHierarchy);
                })();
            },
            exportData() {
                const xml = SDD.save({
                    items: this.items,
                    itemsHierarchy: this.itemsHierarchy,
                    descriptors: this.descriptions,
                    descriptorsHierarchy: this.descriptionsHierarchy,
                });
                download("export.sdd.xml",`<?xml version="1.0" encoding="UTF-8"?>` + xml.documentElement.outerHTML);
            }
        }
    });
}