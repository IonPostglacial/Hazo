<template>
  <div id="app" class="vertical-flexbox lightgrey-background">
    <nav class="horizontal-flexbox space-between">
        <div class="medium-margin">
            <button type="button" v-on:click="toggleLeftMenu">Left Menu</button>
            <button type="button" v-on:click="toggleImageBox">Image Box</button>
        </div>
        <div class="medium-margin">
            <div class="selector" v-for="(tab, index) in tabs" :key="index">
                <input v-model="selectedTab" :id="'tab-radio-' + index" class="selector-radio" name="tab-radio" :value="index" type="radio" />
                <label class="selector-label" :for="'tab-radio-' + index">
                    {{ tab }}
                </label>
            </div>
        </div>
        <div class="medium-margin">
            <select v-model="taxonNameType">
                <option value="scientific">Scientific</option>
                <option value="vernacular">Vernacular</option>
                <option value="chinese">中文名</option>
            </select>
            <div class="selector" v-for="(lang, index) in langs" :key="index">
                <input v-model="selectedLang" :id="'lang-radio-' + index" class="selector-radio" name="lang-radio" :value="index" type="radio" />
                <label class="selector-label" :for="'lang-radio-' + index">
                    {{ lang }}
                </label>
            </div>
        </div>
    </nav>
    <div v-if="showBigImage" class="medium-margin thin-border white-background flex-grow-1 centered-text max-width-screen">
        <div class="horizontal-flexbox cented-aligned">
            <button v-if="bigImageIndex > 0" class="background-color-1 font-size-28" v-on:click="bigImageIndex--">🡄</button>
            <img class="max-width-screen max-height-screen" :src="bigImages[bigImageIndex]">    
            <button v-if="bigImageIndex < bigImages.length - 1" class="background-color-1 font-size-28" v-on:click="bigImageIndex++">🡆</button>
        </div>
        <button class="background-color-1" v-on:click="minimizeImage">Minimize</button>
    </div>
    <div v-if="!showBigImage" class="horizontal-flexbox start-align flex-grow-1 scroll">
        <nav v-if="showLeftMenu" class="scroll medium-margin thin-border white-background">
            <TreeMenu editable v-if="showItems" :items="items" name="item" v-model="selectedItemId"
                :name-fields="['name', 'vernacularName', 'nameCN']"
                v-on:add-item="addItem"
                v-on:delete-item="deleteItem">
            </TreeMenu>
            <TreeMenu v-if="showItemDescriptors" :items="items" name="item" v-model="selectedItemId" :name-fields="[taxonNameField]">
            </TreeMenu>
            <TreeMenu editable v-if="showDescriptors" v-model="selectedDescription" :items="descriptorsDependencyTree" name="description" 
                :name-fields="[nameField]"
                v-on:add-item="addDescription"
                v-on:delete-item="deleteDescription">
            </TreeMenu>
        </nav>
        <TaxonsPanel v-if="showItems" editable
            :show-image-box="showImageBox"
            :item="selectedItem" :descriptions="descriptions"
            v-on:open-photo="maximizeImage">
        </TaxonsPanel>
        <section v-if="showItemDescriptors && typeof selectedItem !== 'undefined'" class="vertical-flexbox flex-grow-1">
            <div class="horizontal-flexbox flex-grow-1 scroll">
                <section class="vertical-flexbox flex-grow-1">
                    <div class="horizontal-flexbox scroll">
                        <TaxonsPanel :item="selectedItem" :descriptions="descriptions" v-on:open-photo="maximizeImage" :show-image-box="showImageBox">
                        </TaxonsPanel>
                        <div v-if="selectedItemId !== 0" class="vertical-flexbox">
                            <ImageBox class="scroll min-height-200" v-if="showImageBox && selectedItemDescriptorId !== 0"
                                v-on:open-photo="maximizeImage"
                                :photos="descriptions[selectedItemDescriptorId].photos"></ImageBox>
                            <TreeMenu class="thin-border medium-margin white-background scroll" v-model="selectedItemDescriptorId"      
                                :items="descriptorsDependencyTree" name="item-description"
                                v-on:add-item="addDescription"
                                v-on:delete-item="deleteDescription">
                            </TreeMenu>
                        </div>
                    </div>
                </section>
                <section v-if="selectedItemId != 0" class="vertical-flexbox flex-grow-1">
                    <div class="thin-border medium-margin medium-padding white-background scroll">
                        <div class="horizontal-flexbox space-between" v-if="selectedItemDescriptorId !== 0">
                            <button class="background-color-ok" v-on:click="addAllItemStates">Check All</button>
                            <button class="background-color-ko" v-on:click="removeAllItemStates"> Uncheck All</button>
                        </div>
                        <label class="horizontal-flexbox" v-if="selectedItemDescriptorId !== 0"><div>&nbsp;</div>
                            <input class="flex-grow-1" placeholder="Filter" type="search" v-model="itemDescriptorSearch" name="search-item-descriptor" id="search-item-descriptor">
                        </label>
                        <ul class="no-list-style" v-if="selectedItemDescriptorId !== 0">
                            <li class="horizontal-flexbox" v-for="(state, stateIndex) in selectedItemDescriptorFilteredStates" :key="state.id">
                                <input v-on:change="addItemState($event, state)" type="checkbox" :name="'state-' + stateIndex" :id="'state-' + stateIndex"
                                    :checked="selectedItem.descriptions.find(d => d.descriptor.id === selectedItemDescriptorId).states.map(s => s.id).includes(state.id)">
                                <input class="flex-grow-1" type="text" v-model="state.name" />
                            </li>
                            <li class="">
                                <AddItem v-on:add-item="addState(descriptions[selectedItemDescriptorId], $event)"></AddItem>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </section>
        <section v-if="showDescriptors && typeof descriptions[selectedDescription] !== 'undefined'" class="vertical-flexbox flex-grow-1">
            <ImageBox v-if="showImageBox"
                :photos="descriptions[selectedDescription].photos"
                editable
                v-on:add-photo="addDescriptionPhoto"
                v-on:set-photo="setDescriptionPhoto"
                v-on:delete-photo="deleteDescriptionPhoto"
                v-on:open-photo="maximizeImage">
            </ImageBox>
            <ul v-if="showDescriptors" class="thin-border medium-margin medium-padding white-background flex-grow-1 scroll">
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name FR</label><input class="flex-grow-1" type="text" v-model="descriptions[selectedDescription].name" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name EN</label><input class="flex-grow-1" type="text" v-model="descriptions[selectedDescription].nameEN" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name CN</label><input class="flex-grow-1" type="text" v-model="descriptions[selectedDescription].nameCN" /></div>

                <label class="item-property">Detail</label>
                <textarea v-model="descriptions[selectedDescription].detail"></textarea><br/>

                <div v-if="descriptions[selectedDescription].inapplicableStates.length > 0">
                    <label>Inapplicable If</label>
                    <ul class="indented">
                        <li class="medium-padding" v-for="state in descriptions[selectedDescription].inapplicableStates" :key="state.id">
                            {{ descriptions[state.descriptorId].name }} IS {{ state.name }}
                        </li>
                    </ul>
                </div>
            </ul>
        </section>
        <section v-if="showDescriptors && typeof descriptions[selectedDescription] !== 'undefined'" class="scroll">
            <div class="relative" style="height: 98%">
                <div class="scroll thin-border medium-margin medium-padding white-background" style="height: 50%;">
                    <label>States</label>
                    <ul class="indented">
                        <li class="medium-padding" v-for="state in descriptions[selectedDescription].states" :key="state.id">
                            <label class="blue-hover medium-padding">
                                <input type="radio" v-model="selectedState" :value="state.id" name="selected-state">
                                <input type="text" v-model="state.name" />
                            </label>
                        </li>
                        <li>
                            <AddItem v-on:add-item="addState(descriptions[selectedDescription], $event)"></AddItem>
                        </li>
                    </ul>
                </div>
                <ImageBox v-if="showImageBox"
                    style="height: 50%;"
                    class="scroll"
                    :photos="selectedDescriptionState.photos"
                    editable
                    v-on:add-photo="addStatePhoto"
                    v-on:set-photo="setStatePhoto"
                    v-on:delete-photo="deleteStatePhoto"
                    v-on:open-photo="maximizeImage">
                </ImageBox>
            </div>
        </section>
    </div>
    <section class="medium-margin horizontal-flexbox space-between">
        <div>
            <button type="button" v-on:click="importData">Import</button>
            <input class="invisible" v-on:change="fileUpload" type="file" accept="application/xml" name="import-data" id="import-data">
            <button type="button" v-on:click="exportData">Export</button>
            <label class="inline-block">
                <input v-model="showMoreActions" class="invisible hide-next-unchecked" type="checkbox" name="more-actions" id="more-actions">
                <button href="#1" v-on:click="completeData">Merge Taxons Info</button>
                <div v-if="!showMoreActions" class="button">More</div>
                <div v-if="showMoreActions" class="button">Less</div>
            </label>
            <input class="invisible" v-on:change="fileComplete" type="file" accept="application/xml" name="complete-data" id="complete-data">
        </div>
        <div>
            <button type="button" class="background-color-ok" v-on:click="saveData">Save</button>
            <select v-on:change="loadDB($event.target.value)">
                <option v-for="databaseId in databaseIds" :key="databaseId" :value="databaseId">Database #{{ databaseId }}</option>
            </select>
            <button type="button" class="background-color-1" v-on:click="createNewDatabase">New DB</button>
            <button type="button" class="background-color-ko" v-on:click="resetData">Reset</button>
        </div>
        <a class="button" href="./merger.html">Merger</a>
    </section>
  </div>
</template>

<script>
import AddItem from "./components/AddItem.vue";
import TreeMenu from "./components/TreeMenu.vue";
import ImageBox from "./components/ImageBox.vue";
import TaxonsPanel from "./components/TaxonsPanel.vue";
import DB from "./db-storage.js";
import Vue from "../node_modules/vue/dist/vue.esm.browser.js";
import loadSDD from "./sdd-load";
import saveSDD from "./sdd-save";

function download(text) {
    const filename = window.prompt("Choose a file name", "export") + ".sdd.xml";
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

export default {
    name: "App",
    components: {
        AddItem, TreeMenu, ImageBox, TaxonsPanel
    },
    data() {
        function loadBase(id) {
            DB.load(id | 0).then(savedDataset => {
                defaultData.items = savedDataset?.taxons ?? {};
                defaultData.descriptions = savedDataset?.descriptors ?? {};
            });
        }

        let databaseIds = [];

        DB.list().then(dbIds => databaseIds = dbIds);

        const defaultData = {
            databaseIds,
            selectedBase: 0,
            showLeftMenu: true,
            showImageBox: true,
            selectedItemId: 0,
            selectedDescription: 0,
            selectedState: 0,
            selectedItemDescriptorId: 0,
            itemDescriptorSearch: "",
            newItemPhoto: "",
            newDescriptionPhoto: "",
            selectedTab: 0,
            bigImages: [""],
            bigImageIndex: 0,
            showBigImage: false,
            showMoreActions: false,
            tabs: [
                "Taxons",
                "Taxons Descriptors",
                "Descriptors"
            ],
            langs: ["FR", "EN", "CN"],
            taxonNameType: "scientific",
            selectedLang: 0,
            items: {},
            descriptions: {},
        };

        loadBase(0);

        return defaultData;
    },
    computed: {
        nameField() {
            switch(this.selectedLang) {
                case 0: return "name";
                case 1: return "nameEN";
                case 2: return "nameCN";
                default: return "name";
            }
        },
        taxonNameField() {
            switch(this.taxonNameType) {
                case "scientific": return "name";
                case "vernacular": return "vernacularName";
                case "chinese": return "nameCN";
                default: return "name"; 
            }
        },
        selectedItemIdStates() {
            const states = [];

            for (const description of this.selectedItem.descriptions) {
                for (const state of description.states) {
                    states.push(state);
                }
            }

            return states;
        },
        selectedItem() {
            return this.items[this.selectedItemId] ?? {};
        },
        selectedDescriptionState() {
            return this.descriptions[this.selectedDescription].states?.find(s => s.id === this.selectedState) ?? {};
        },
        selectedItemDescriptorFilteredStates() {
            return this.descriptions[this.selectedItemDescriptorId].states.filter(s => s.name.toUpperCase().startsWith(this.itemDescriptorSearch.toUpperCase()));
        },
        selectedItemDescriptorTree() {
            const itemStatesIds = [];
            const selectedItemIdDescriptions = this.selectedItem.descriptions ?? [];
            const dependencyTree = JSON.parse(JSON.stringify(this.descriptions));
            for (const description of selectedItemIdDescriptions) {
                for (const state of description?.states ?? []) {
                    itemStatesIds.push(state.id);
                }
            }
            for (const descriptor of Object.values(dependencyTree)) {
                const selectedDescription = selectedItemIdDescriptions.find(d => d.descriptor.id === descriptor.id);
                if (typeof selectedDescription === "undefined") continue;
                const descriptorStates = selectedDescription.states.map(s => Object.assign({ type: "state", parentId: s.descriptorId }, s));

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
        loadBase(id) {
            DB.load(id | 0).then(savedDataset => {
                this.items = savedDataset?.taxons ?? {};
                this.descriptions = savedDataset?.descriptors ?? {};
            });
        },
        loadDB(id) {
            this.selectedBase = id;
            this.loadBase(id);
        },
        createNewDatabase() {
            const newDatabaseId = this.databaseIds.length;
            this.databaseIds.push(newDatabaseId)
            this.selectedBase = newDatabaseId;
            this.resetData();
        },
        toggleLeftMenu() {
            this.showLeftMenu = !this.showLeftMenu;
        },
        toggleImageBox() {
            this.showImageBox = !this.showImageBox;
        },
        maximizeImage({ photos, index }) {
            this.showBigImage = true;
            this.bigImages = photos;
            this.bigImageIndex = index;
        },
        minimizeImage() {
            this.showBigImage = false;
            this.bigImages = [];
            this.bigImageIndex = 0;
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
        addStatePhoto(photo) {
            if (typeof this.selectedDescriptionState.photos === "undefined") {
                this.selectedDescriptionState.photos = [];
            }
            this.selectedDescriptionState.photos.push(photo);
        },
        setStatePhoto(index, photo) {
            this.selectedDescriptionState.photos[index] = photo;
        },
        deleteStatePhoto(index) {
            this.selectedDescriptionState.photos.splice(index, 1);
        },
        addItem({ value, parentId }) {
            let newItemIdNum = Object.keys(this.items).length;
            do {
                newItemIdNum++
            } while(typeof this.items["myt-" + newItemIdNum] !== "undefined");
            const newItemId = "myt-" + newItemIdNum;
            const newItem = {
                hid: "mytn-" + newItemId, id: newItemId, name: value, photos: [],
                topLevel: typeof parentId === "undefined", parentId: parentId, children: {}, open: false, descriptions: []
            };
            this.items = { ...this.items, [newItemId]: newItem };
            if (typeof parentId !== "undefined") {
                this.items[parentId].children = { ...this.items[parentId].children, [newItemId]: newItem };
            }
        },
        addItemState(e, state) {
            const selectedDescription = this.selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptorId);
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
            const selectedDescription = this.selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptorId);

            selectedDescription.states = [...this.descriptions[selectedDescription.descriptor.id].states];
        },
        removeAllItemStates() {
            const selectedDescription = this.selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptorId);

            selectedDescription.states = [];
        },
        deleteItem({ parentId, itemId }) {
            if (typeof parentId !== "undefined") {
                Vue.delete(this.items[parentId].children, itemId);
            }
            Vue.delete(this.items, itemId);
        },
        addDescription({ value, parentId }) {
            const newDescriptionId = "myd-" + Object.keys(this.descriptions).length;
            const newDescription = {
                hid: "mydn-" + Object.keys(this.descriptions).length, id: newDescriptionId, name: value,states: [],
                topLevel: typeof parentId === "undefined", children: {}, open: false, inapplicableStates: []
            };
            this.descriptions = { ...this.descriptions, [newDescriptionId]: newDescription };
            if(typeof parentId !== "undefined") {
                this.descriptions[parentId].children = { ...this.descriptions[parentId].children, [newDescriptionId]: newDescription };
            }
        },
        deleteDescription({ parentId, itemId }) {
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
            DB.store({ id: this.selectedBase | 0, taxons: this.items, descriptors: this.descriptions });
        },
        resetData() {
            Vue.set(this.$data, "items", {});
            Vue.set(this.$data, "descriptions", {});
        },
        importData() {
            document.getElementById("import-data").click();
        },
        completeData() {
            document.getElementById("complete-data").click();
        },
        fileComplete(e) {
            const file = e.target.files[0];

            (async () => {
                const { items } = await loadSDD(file);
                const properties = [
                    "name", "nameEN", "nameCN", "vernacularName", "meaning",
                    "noHerbier", "herbariumPicture", "fasc", "page"
                ];
                for (const taxon of Object.values(items)) {
                    const existingTaxon = this.items[taxon.id];
                    if (typeof existingTaxon === "undefined") {
                        Vue.set(this.items, taxon.id, taxon);
                        continue;
                    }
                    for (const property of properties) {
                        const newValue = taxon[property];
                        if (typeof newValue !== "undefined" && newValue !== null && newValue !== "") {
                            existingTaxon[property] = newValue;
                        }
                    }
                }
            })();
        },
        fileUpload(e) {
            const file = e.target.files[0];

            (async () => {
                const {
                    items,
                    descriptors,
                } = await loadSDD(file);
                Vue.set(this.$data, "items", items);
                Vue.set(this.$data, "descriptions", descriptors);
            })();
        },
        exportData() {
            const xml = saveSDD({
                items: this.items,
                descriptors: this.descriptions,
            });
            download(`<?xml version="1.0" encoding="UTF-8"?>` + xml.documentElement.outerHTML);
        }
    }
}
</script>
