<template>
  <div id="app" class="vertical-flexbox lightgrey-background height-full">
    <nav class="horizontal-flexbox space-between thin-border">
        <div class="medium-margin">
            <button type="button" v-on:click="toggleLeftMenu">Left Menu</button>
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
            <button type="button" v-on:click="toggleImageBox">Image Box</button>
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
            :init-items="items" :descriptions="descriptions"
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
    <section class="medium-margin horizontal-flexbox space-between thin-border">
        <div>
            <button type="button" v-on:click="jsonImport">Import</button>
            <input class="invisible" v-on:change="jsonUpload" type="file" accept="text/json" name="import-json" id="import-json">
            <button type="button" v-on:click="jsonExport">Export</button>
            <button type="button" v-on:click="importSDD">Import SDD</button>
            <input class="invisible" v-on:change="fileUpload" type="file" accept="application/xml" name="import-data" id="import-data">
            <button type="button" v-on:click="exportSDD">Export SDD</button>
        </div>
        <div>
            <button type="button" class="background-color-ok" v-on:click="saveData">Save</button>
            <select v-model="selectedBase">
                <option v-for="databaseId in databaseIds" :key="databaseId" :value="databaseId">Database #{{ databaseId }}</option>
            </select>
            <button type="button" class="background-color-1" v-on:click="createNewDatabase">New DB</button>
            <button type="button" class="background-color-ko" v-on:click="resetData">Reset</button>
            <button type="button" v-on:click="globalReplace">Text Replace</button>
        </div>
        <div>
            <button type="button" v-on:click="exportStats">Stats</button>
            <button type="button" v-on:click="emptyZip">Folder Hierarchy</button>
            <button type="button" v-on:click="texExport">Latex{{latexProgressText}}</button>
            <button type="button" class="background-color-1" v-on:click="editExtraFields">Fields</button>
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
        return {
            databaseIds: [0],
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
            extraFields: [],
            items: {},
            descriptions: {},
            dictionaryEntries: {},
            latexProgressText: "",
        };
    },
    mounted() {
        DB.list().then(dbIds => this.databaseIds = dbIds);
        this.loadBase();
    },
    watch: {
        selectedBase(val) {
            this.loadBase(val);
        }
    },
    methods: {
        loadBase(id) {
            DB.load(id | 0).then(savedDataset => {
                this.resetData();
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
            this.databaseIds.push(newDatabaseId);
            this.selectedBase = newDatabaseId;
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
            for (const key of Object.keys(this.items)) {
                Vue.delete(this.items, key);
            }
            for (const key of Object.keys(this.descriptions)) {
                Vue.delete(this.descriptions, key);
            }
        },
        importSDD() {
            document.getElementById("import-data").click();
        },
        jsonImport() {
            document.getElementById("import-json").click();
        },
        globalReplace() {
            const pattern = window.prompt("Text pattern to replace");
            const replacement = window.prompt("Replacement");
            const re = new RegExp(pattern, "gi");

            for (const [key, item] of Object.entries(this.items)) {
                const newDetail = item.detail.replace(re, replacement);
                this.items[key] = { ...item, detail: newDetail };
            }
            for (const [key, description] of Object.entries(this.descriptions)) {
                const newDetail = description.detail.replace(re);
                this.descriptions[key] = { ...description, detail: newDetail };
            }
        },
        fileUpload(e) {
            const file = e.target.files[0];

            (async () => {
                const {
                    items,
                    descriptors,
                } = await loadSDD(file, this.extraFields);
                for (const [key, value] of Object.entries(items)) {
                    Vue.set(this.items, key, value);
                }
                for (const [key, value] of Object.entries(descriptors)) {
                    Vue.set(this.descriptions, key, value);
                }
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
        emptyZip() {
            const zipTxt = new Blob([window.bunga.Hierarchy.toZip(this.items)], {type: "application/zip"});
            download(zipTxt, "zip", true);
        },
        texExport() {
            const taxonToTex = new window.bunga.TaxonToTex(Object.values(this.items));
            taxonToTex.onProgress((current, max) =>  { this.latexProgressText = " [" + current + " / " + max + "]" });
            taxonToTex.export(Object.values(this.items)).then(tex => {
                this.latexProgressText = "";
                const blob = new Blob([tex], {type: "application/zip"});
                download(blob, "zip", true);
            });
        },
        compressItem(item) {
            return { ...item,
                children: Object.keys(item.children),
                descriptions: item.descriptions.map(({descriptor, states}) => ({
                    descriptorId: descriptor.id, 
                    statesIds: states.map(s => s.id),
                })),
            };
        },
        unCompressItem(item, items, descriptions, states) {
            return { ...item,
                children: item.children.map(id => items[id]),
                descriptions: item.descriptions.map(({descriptorId, statesIds}) => ({
                    descriptor: descriptions[descriptorId],
                    states: statesIds.map(id => states[id]),
                })),
            };
        },
        compressDescription(description) {
            return { ...description,
                children: Object.keys(description.children),
                states: description.states.map(s => s.id) 
            };
        },
        uncompressDescription(description, descriptions, states) {
            return { ...description,
                children: description.children.map(id => descriptions[id]),
                states: description.states.map(id => states[id]),
            };
        },
        getAllStates() {
            let states = [];
            for (const description of Object.values(this.descriptions)) {
                states = states.concat(description.states);
            }
            return states;
        },
        jsonExport() {
            const json = JSON.stringify({
                id: this.selectedBase | 0,
                taxons: Object.values(this.items).map(this.compressItem),
                descriptors: Object.values(this.descriptions).map(this.compressDescription),
                states: this.getAllStates(),
                extraFields: this.extraFields,
                dictionaryEntries: this.dictionaryEntries
            });
            download(json, "bunga.json");
        },
        jsonUpload(e) {
            const file = e.target.files[0];
            const fileReader = new FileReader();
            fileReader.onload = () => {
                const db = JSON.parse(fileReader.result);
                const states = Object.fromEntries(db.states.map(s => [s.id, s]));
                const descriptions = Object.fromEntries(db.descriptors.map(d => [d.id, {}]));
                for (const description of db.descriptors) {
                    Object.assign(descriptions[description.id], this.uncompressDescription(description, descriptions, states));
                }
                const items = Object.fromEntries(db.taxons.map(t => [t.id, {}]));
                for (const taxon of db.taxons) {
                    Object.assign(items[taxon.id], this.unCompressItem(taxon, items, descriptions, states));
                }

                this.extraFields = db.extraFields;

                for (const description of Object.values(descriptions)) {
                    Vue.set(this.descriptions, description.id, description);
                }
                for (const item of Object.values(items)) {
                    Vue.set(this.items, item.id, item);
                }
                for (const entry of Object.values(db.dictionaryEntries)) {
                    Vue.set(this.dictionaryEntries, entry.id, entry);
                }
            };
            fileReader.readAsText(file);
        },
        exportSDD() {
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
