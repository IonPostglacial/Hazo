window.addEventListener("load", main);

async function main() {
    function download(filename, text) {
        const element = document.createElement("a");
        element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
        element.setAttribute("download", filename);

        element.style.display = "none";
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    const savedDataset = await DB.load();

    const defaultData = {
        showLeftMenu: true,
        showImageBox: true,
        selectedItem: 0,
        selectedDescription: 0,
        selectedItemDescriptor: 0,
        itemDescriptorSearch: "",
        newItemPhoto: "",
        newDescriptionPhoto: "",
        selectedTab: 0,
        tabs: [
            "Taxons",
            "Taxons Descriptors",
            "Descriptors"
        ],
        items: savedDataset?.taxons ?? {},
        descriptions: savedDataset?.descriptors ?? {},
    };

    var app = new Vue({
        el: '#app',
        data: defaultData,
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
                const dependencyTree = JSON.parse(JSON.stringify(this.descriptions));
                for (const description of selectedItemDescriptions) {
                    for (const state of description.states) {
                        itemStatesIds.push(state.id);
                    }
                }
                for (const descriptor of Object.values(dependencyTree)) {
                    const descriptorStates = selectedItemDescriptions.
                        find(d => d.descriptor.id === descriptor.id).states.map(s => Object.assign({ type: "state", parentId: s.descriptorId }, s));

                    if (descriptor.inapplicableStates.some(s => itemStatesIds.findIndex(id => id === s.id) >= 0 )) {
                        descriptor.hidden = true;
                    }

                    if (descriptorStates.length === 0) {
                        descriptor.warning = true;
                        descriptor.children = {};
                    }
                    Object.assign(descriptor.children, descriptorStates);
                }
                return dependencyTree;
            },
            showItems() {
                return this.selectedTab == 0;
            },
            showItemDescriptors() {
                return this.selectedTab == 1;
            },
            showDescriptors() {
                return this.selectedTab == 2;
            },
            descriptorsDependencyTree() {
                return this.descriptions;
            }
        },
        methods: {
            toggleLeftMenu() {
                this.showLeftMenu = !this.showLeftMenu;
            },
            toggleImageBox() {
                this.showImageBox = !this.showImageBox;
            },
            openAll() {
                const hierarchy = this.selectedTab == 0 ? this.items: this.descriptions;

                for (const entry of Object.values(hierarchy)) {
                    entry.open = true;
                }
            },
            closeAll() {
                const hierarchy = this.selectedTab == 0 ? this.items : this.descriptions;

                for (const entry of Object.values(hierarchy)) {
                    entry.open = false;
                }                
            },
            addItemPhoto(photo) {
                this.items[this.selectedItem].photos.push(photo);
            },
            setItemPhoto(index, photo) {
                this.items[this.selectedItem].photos[index] = photo;
            },
            deleteItemPhoto(index) {
                this.items[this.selectedItem].photos.splice(index, 1);
            },
            openItemPhoto(photo) {
                window.open(photo, "_blank");
            },
            addDescriptionPhoto(photo) {
                this.descriptions[this.selectedDescription].photos.push(photo);
            },
            setDescriptionPhoto(index, photo) {
                this.descriptions[this.selectedDescription].photos[index] = photo;
            },
            deleteDescriptionPhoto(index) {
                this.descriptions[this.selectedDescription].photos.splice(index, 1);
            },
            openDescriptionPhoto(photo) {
                window.open(photo, "_blank");
            },
            addItem({ value, parentId }) {
                const newItemId = "myt-" + Object.keys(this.items).length;
                const newItem = {
                    hid: "mytn-" + Object.keys(this.items).length, id: newItemId, name: value, photos: [],
                    topLevel: typeof parentId === "undefined", children: {}, open: false
                };
                Vue.set(this.items, newItemId, newItem);
                if (typeof parentId !== "undefined") {
                    Vue.set(this.items[parentId].children, newItemId, newItem);
                }
            },
            addItemPhoto(photo) {
                this.items[this.selectedItem].photos.push(photo);
            },
            deleteItemPhoto(index) {
                this.items[this.selectedItem].photos.splice(index, 1);
            },
            addDescriptionPhoto(photo) {
                this.descriptions[this.selectedDescription].photos.push(photo);
            },
            deleteDescriptionPhoto(index) {
                this.descriptions[this.selectedDescription].photos.splice(index, 1);
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
            itemDescriptorsButtonClicked({ buttonId, parentId, id, itemId }) {
                if (buttonId === "pushToChildren") {
                   const descriptor = this.descriptions[parentId];
                   const state = descriptor.states.find(s => s.id === id);
                   const item = this.items[this.selectedItem];

                   for (const child of Object.values(item.children)) {
                       const desc = child.descriptions.find(d => d.descriptor.id === descriptor.id);
                       if (!desc.states.find(s => s.id === state.id)) {
                            desc.states.push(Object.assign({}, state));
                       }
                   }
                }
            },
            deleteItem({ parentId, id, itemId }) {
                if (typeof parentId !== "undefined") {
                    Vue.delete(this.items[parentId].children, itemId);
                }
                Vue.delete(this.items, itemId);
            },
            addDescription({ value, parentId }) {
                const newDescriptionId = "myd-" + Object.keys(this.descriptions).length;
                const newDescription = {
                    hid: "mydn-" + Object.keys(this.descriptions).length, id: newDescriptionId, name: value,states: [],
                    topLevel: typeof parentId === "undefined", children: {}, open: false
                };
                Vue.set(this.descriptions, newDescriptionId, newDescription);
                if(typeof parentId !== "undefined") {
                    Vue.set(this.descriptions[parentId].children, newDescriptionId, newDescription);
                }
            },
            deleteDescription({ parentId, id, itemId }) {
                if (typeof parentId !== "undefined") {
                    Vue.delete(this.descriptions[parentId].children, itemId);
                }
                Vue.delete(this.descriptions, itemId);
            },
            addState(description, value) {
                description.states.push({
                    id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                    descriptorId: description.id,
                    name: value
                });
            },
            saveData() {
                DB.store({ id: 0, taxons: this.items, descriptors: this.descriptions });
            },
            resetData() {
                Vue.set(this.$data, "items", {});
                Vue.set(this.$data, "descriptions", {});
            },
            importData() {
                const dataImport = document.getElementById("import-data");

                dataImport.click();
            },
            fileUpload(e) {
                const file = e.target.files[0];

                (async () => {
                    const {
                        items,
                        descriptors,
                    } = await SDD.load(file);
                    Vue.set(this.$data, "items", items);
                    Vue.set(this.$data, "descriptions", descriptors);
                })();
            },
            exportData() {
                const xml = SDD.save({
                    items: this.items,
                    descriptors: this.descriptions,
                });
                download("export.sdd.xml",`<?xml version="1.0" encoding="UTF-8"?>` + xml.documentElement.outerHTML);
            }
        }
    });
}