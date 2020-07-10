<template>
  <div id="app" class="vertical-flexbox lightgrey-background height-full">
    <nav class="horizontal-flexbox space-between thin-border">
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
    <div :class="'horizontal-flexbox start-align flex-grow-1 height-main-panel ' + (showBigImage ? 'invisible' : '')">
        <TaxonsTab v-if="selectedTab === 0"
            :init-items="items" :descriptions="descriptions"
            :show-left-menu="showLeftMenu" :show-image-box="showImageBox"
            :extra-fields="extraFields"
            v-on:open-photo="maximizeImage">
        </TaxonsTab>
        <TaxonsDescriptorsTab v-if="selectedTab === 1"
            :init-items="items" :descriptions="descriptions" :taxon-name-field="taxonNameField"
            :show-left-menu="showLeftMenu" :show-image-box="showImageBox"
            :extra-fields="extraFields"
            v-on:open-photo="maximizeImage">
        </TaxonsDescriptorsTab>
        <CharactersTab v-if="selectedTab === 2"
            :init-descriptions="descriptions"
            :show-left-menu="showLeftMenu" :show-image-box="showImageBox"
            v-on:open-photo="maximizeImage">
        </CharactersTab>
        <WordsDictionary :init-entries="dictionaryEntries" v-if="selectedTab === 3"></WordsDictionary>
    </div>
    <section class="medium-margin horizontal-flexbox space-between">
        <div>
            <button type="button" v-on:click="importData">Import</button>
            <input class="invisible" v-on:change="fileUpload" type="file" accept="application/xml" name="import-data" id="import-data">
            <button type="button" v-on:click="exportData">Export</button>
            <button type="button" v-on:click="exportStats">Stats</button>
        </div>
        <div>
            <button type="button" class="background-color-ok" v-on:click="saveData">Save</button>
            <select v-on:change="loadDB($event.target.value)">
                <option v-for="databaseId in databaseIds" :key="databaseId" :value="databaseId">Database #{{ databaseId }}</option>
            </select>
            <button type="button" class="background-color-1" v-on:click="createNewDatabase">New DB</button>
            <button type="button" class="background-color-ko" v-on:click="resetData">Reset</button>
        </div>
        <div>
            <button type="button" class="background-color-1" v-on:click="editExtraFields">Fields</button>
            <a class="button" href="./merger.html">Merger</a>
        </div>
    </section>
  </div>
</template>

<script>
import TaxonsTab from "./components/TaxonsTab.vue";
import TaxonsDescriptorsTab from "./components/TaxonsDescriptorsTab.vue";
import CharactersTab from "./components/CharactersTab.vue";
import WordsDictionary from "./components/WordsDictionary.vue";
import DB from "./db-storage.js";
import Vue from "../node_modules/vue/dist/vue.esm.browser.js";
import loadSDD from "./sdd-load";
import saveSDD from "./sdd-save";
import download from "./download.js";

export default {
    name: "App",
    components: {
        TaxonsTab, TaxonsDescriptorsTab, CharactersTab, WordsDictionary
    },
    data() {
        let databaseIds = [];
        DB.list().then(dbIds => databaseIds = dbIds);

        return {
            databaseIds,
            selectedBase: 0,
            showLeftMenu: true,
            showImageBox: true,
            selectedTab: 0,
            bigImages: [""],
            bigImageIndex: 0,
            showBigImage: false,
            tabs: [
                "Taxons",
                "Taxons Descriptors",
                "Descriptors",
                "Dictionary"
            ],
            langs: ["FR", "EN", "CN"],
            taxonNameType: "scientific",
            extraFields: [],
            items: {},
            descriptions: {},
            dictionaryEntries: {},
        };
    },
    mounted() {
        this.loadBase();
    },
    computed: {
        taxonNameField() {
            switch(this.taxonNameType) {
                case "scientific": return "name";
                case "vernacular": return "vernacularName";
                case "chinese": return "nameCN";
                default: return "name"; 
            }
        },
    },
    methods: {
        loadBase(id) {
            DB.load(id | 0).then(savedDataset => {
                for (const [id, taxon] of Object.entries(savedDataset?.taxons ?? {})) {
                    Vue.set(this.items, id, taxon);
                }
                for (const [id, character] of Object.entries(savedDataset?.descriptors ?? {})) {
                    Vue.set(this.descriptions, id, character);
                }
                this.extraFields = savedDataset?.extraFields ?? [];
                this.dictionaryEntries = savedDataset?.dictionaryEntries ?? {};
            });
        },
        loadDB(id) {
            this.selectedBase = id;
            this.loadBase(id);
        },
        editExtraFields() {
            const extraFieldsText = window.prompt("Extra Fields", this.extraFields.map(({ id, label }) => `${id}:${label}`).join(","));
            if (typeof extraFieldsText === "undefined" || extraFieldsText === null) return;
            const extraFields = [];
            for (const fieldText of extraFieldsText.split(",")) {
                const parts = fieldText.split(":");
                if (parts.length !== 2) {
                    console.log("bad format for Extra Fields");
                    return;
                }
                extraFields.push({ id: parts[0].trim(), label: parts[1].trim() });
            }
            this.extraFields = extraFields;
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
        saveData() {
            DB.store({ id: this.selectedBase | 0, taxons: this.items, descriptors: this.descriptions, extraFields: this.extraFields, dictionaryEntries: this.dictionaryEntries });
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
        fileUpload(e) {
            const file = e.target.files[0];

            (async () => {
                const {
                    items,
                    descriptors,
                } = await loadSDD(file, this.extraFields);
                Vue.set(this.$data, "items", items);
                Vue.set(this.$data, "descriptions", descriptors);
            })();
        },
        exportStats() {
            const references = [];
            const div = document.createElement("div");
            const startsWithLetter = /^[^\W\d_]+.*/;
            for (const item of Object.values(this.items)) {
                div.innerHTML = item.detail;
                const words = div.innerText.split(/[\s\t,;:=/."'-()]/) ?? [];
                for (const word of words) {
                    const trimmedWord = word.trim();
                    if (startsWithLetter.test(trimmedWord)) {
                        references.push({ word: trimmedWord, origin: item.id });
                    }
                }
            }
            let csv = "\uFEFFword,origin\n";
            for (const { word, origin } of references) {
                let escapedWord = word;
                if (escapedWord.includes(",") || escapedWord.includes("\n")) {
                    escapedWord = escapedWord.replace('"', '""');
                    escapedWord = `"${escapedWord}"`;
                }
                csv += escapedWord + "," + origin + "\n";
            }
            download(csv, "csv");
        },
        exportData() {
            const xml = saveSDD({
                items: this.items,
                descriptors: this.descriptions,
                extraFields: this.extraFields,
            });
            download(`<?xml version="1.0" encoding="UTF-8"?>` + xml.documentElement.outerHTML, "sdd.xml");
        }
    }
}
</script>
