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
            <button type="button" v-on:click="editExtraFields">Extra Fields</button>
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
            :init-items="items" :descriptions="descriptions" v-on:taxon-selected="selectTaxon" 
            :selected-taxon="selectedTaxon"
            :show-left-menu="showLeftMenu" :show-image-box="showImageBox"
            :extra-fields="extraFields" :books="books" 
            v-on:open-photo="maximizeImage" v-on:change-items="changeItems">
        </TaxonsTab>
        <TaxonsDescriptorsTab v-if="selectedTab === 1"
            :init-items="items" :descriptions="descriptions" v-on:taxon-selected="selectTaxon" :selected-taxon="selectedTaxon"
            :show-left-menu="showLeftMenu" :show-image-box="showImageBox"
            :extra-fields="extraFields" :books="books" 
            v-on:open-photo="maximizeImage">
        </TaxonsDescriptorsTab>
        <CharactersTab v-if="selectedTab === 2"
            :init-descriptions="descriptions"
            :show-left-menu="showLeftMenu" :show-image-box="showImageBox"
            v-on:open-photo="maximizeImage" v-on:change-descriptions="changeDescriptions">
        </CharactersTab>
        <WordsDictionary :init-entries="dictionaryEntries" v-if="selectedTab === 3"></WordsDictionary>
        <div v-if="showFields" class="height-full medium-margin thin-border white-background medium-padding horizontal-flexbox fixed-right">
            <ul class="vertical-flexbox scroll">
                <li v-for="field in extraFields" :key="field.id" class="horizontal-flexbox">
                    <label class="nowrap">
                        Id:&nbsp;
                        <input type="text" v-model="field.id">
                    </label>
                    <label class="nowrap">
                        Label:&nbsp;
                    <input type="text" v-model="field.label">
                    </label>
                    <div class="close" style="width: 42px;" v-on:click="deleteExtraField(field.id)">&nbsp;</div>
                </li>
                <AddItem v-on:add-item="addExtraField"></AddItem>
            </ul>
        </div>
    </div>
    <section class="medium-margin horizontal-flexbox space-between thin-border">
        <div>
            <button type="button" v-on:click="importFile">Import</button>
            <button type="button" v-on:click="jsonExport">Export</button>
            <button type="button" v-on:click="exportSDD">Export SDD</button>
            <button type="button" v-on:click="mergeFile">Merge</button>
            <input class="invisible" v-on:change="fileUpload" type="file" accept=".sdd.xml,.json,.csv,application/xml" name="import-data" id="import-data">
            <input class="invisible" v-on:change="fileMerge" type="file" accept=".sdd.xml,.json,application/xml" name="merge-data" id="merge-data">
        </div>
        <div>
            <button type="button" class="background-color-ok" v-on:click="saveData">Save</button>
            <select v-model="selectedBase">
                <option v-for="databaseId in databaseIds" :key="databaseId" :value="databaseId">Database #{{ databaseId }}</option>
            </select>
            <button type="button" class="background-color-1" v-on:click="createNewDatabase">New DB</button>
            <button type="button" class="background-color-ko" v-on:click="resetData">Reset</button>
        </div>
        <div>
            <button type="button" v-on:click="globalReplace">Text Replace</button>
            <button type="button" v-on:click="exportStats">Stats</button>
            <button type="button" v-on:click="emptyZip">Folder Hierarchy</button>
            <button type="button" v-on:click="texExport">Latex{{latexProgressText}}</button>
        </div>
    </section>
  </div>
</template>

<script lang="ts">
import type { bunga_Character as Character, bunga_Dataset as Dataset, // eslint-disable-line no-unused-vars
    bunga_Field as Field, bunga_Taxon as Taxon } from "./libs/SDD"; // eslint-disable-line no-unused-vars
import TaxonsTab from "./components/TaxonsTab.vue";
import TaxonsDescriptorsTab from "./components/TaxonsDescriptorsTab.vue";
import CharactersTab from "./components/CharactersTab.vue";
import WordsDictionary from "./components/WordsDictionary.vue";
import AddItem from "./components/AddItem.vue";
import DB from "./db-storage";
import Vue from "vue";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save.js";
import download from "./download";

export default Vue.extend({
    name: "App",
    components: {
        AddItem, TaxonsTab, TaxonsDescriptorsTab, CharactersTab, WordsDictionary
    },
    data() {
        const items: Record<string, Taxon> = {};
        const descriptions: Record<string, Character> = {};
        return {
            databaseIds: ["0"],
            selectedBase: "0",
            showLeftMenu: true,
            showImageBox: true,
            showFields: false,
            selectedTab: 0,
            selectedTaxon: "",
            bigImages: [""],
            bigImageIndex: 0,
            showBigImage: false,
            tabs: [
                "Taxons",
                "Taxons Descriptors",
                "Descriptors",
                "Dictionary"
            ],
            extraFields: new Array<Field>(),
            books: window.bunga.Book.standard,
            items,
            descriptions,
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
        loadBase(id?: string) {
            DB.load(id ?? "0").then(savedDataset => {
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
        changeDescriptions(descriptions: Record<string, Character>) {
            this.descriptions = descriptions;
        },
        changeItems(items: Record<string, Taxon>) {
            this.items = items;
        },
        selectTaxon(id: string) {
            this.selectedTaxon = id;
        },
        editExtraFields() {
            this.showFields = !this.showFields;
        },
        addExtraField(name: string) {
            this.extraFields.push({ id: name, std: false, label: name });
        },
        deleteExtraField(id:string) {
            const i = this.extraFields.findIndex(f => f.id === id);
            if (i >= 0) {
                this.extraFields.splice(i, 1);
            }
        },
        createNewDatabase() {
            const newDatabaseId = "" + this.databaseIds.length;
            this.databaseIds.push(newDatabaseId);
            this.selectedBase = newDatabaseId;
        },
        toggleLeftMenu() {
            this.showLeftMenu = !this.showLeftMenu;
        },
        toggleImageBox() {
            this.showImageBox = !this.showImageBox;
        },
        maximizeImage({ photos, index }: { photos: string[], index: number }) {
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
            DB.store({ id: this.selectedBase, taxons: this.items, descriptors: this.descriptions, extraFields: this.extraFields, dictionaryEntries: this.dictionaryEntries, books: window.bunga.Book.standard });
        },
        resetData() {
            for (const key of Object.keys(this.items)) {
                Vue.delete(this.items, key);
            }
            for (const key of Object.keys(this.descriptions)) {
                Vue.delete(this.descriptions, key);
            }
        },
        importFile() {
            document.getElementById("import-data")?.click();
        },
        mergeFile() {
            document.getElementById("merge-data")?.click();
        },
        globalReplace() {
            const pattern = window.prompt("Text pattern to replace") ?? "";
            const replacement = window.prompt("Replacement") ?? "";
            const re = new RegExp(pattern, "g");

            for (const [key, item] of Object.entries(this.items)) {
                const newDetail = item.detail.replace(re, replacement);
                this.items[key] = Object.assign({}, item, { detail: newDetail });
            }
            for (const [key, description] of Object.entries(this.descriptions)) {
                const newDetail = description.detail.replace(re, replacement);
                this.descriptions[key] = Object.assign({}, description, { detail: newDetail });
            }
        },
        async fileRead(file: File): Promise<Dataset | null> {
            let result: Dataset | null = null;
            if (file.name.endsWith(".xml")) {
                result = await loadSDD(file, this.extraFields);
            } else if (file.name.endsWith(".json")) {
                result = await this.jsonUpload(file);
            } else if (file.name.endsWith(".bunga.bold.csv")) {
                result = await this.boldUpload(file);
            }
            return result;
        },
        async fileMerge(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const result = await this.fileRead((e.target.files ?? [])[0]);
            const propertiesToMerge = (window.prompt("Properties to merge ?") ?? "").split(",");
            const resultsByName: Record<string, Taxon> = {};
            for (const item of Object.values(result?.taxons ?? {})) {
                resultsByName[item.name] = item;
            }
            for (const item of Object.values(this.items)) {
                const newInfo: any = resultsByName[item.name], anyItem: any = item;
                if (typeof newInfo !== "undefined") {
                    for (const prop of propertiesToMerge) {
                        const value: any = newInfo[prop];
                        const oldValue: any = anyItem[prop];
                        if (typeof oldValue === "undefined" || oldValue === null || oldValue === "" && typeof value !== "undefined" && value !== null) {
                            anyItem[prop] = value;
                        }
                    }
                }
            }
        },
        async fileUpload(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const result = await this.fileRead((e.target.files ?? [])[0]);
            if (typeof result === "undefined" || result === null) return;

            if (typeof result.extraFields !== "undefined") {
                this.extraFields = result.extraFields;
            }
            if (typeof result.descriptors !== "undefined") {
                for (const description of Object.values(result.descriptors)) {
                    Vue.set(this.descriptions, description.id, description);
                }
            }
            if (typeof result.taxons !== "undefined") {
                for (const item of Object.values(result.taxons)) {
                    Vue.set(this.items, item.id, item);
                }
            }
            if (typeof result.dictionaryEntries !== "undefined") {
                for (const entry of Object.values(result.dictionaryEntries)) {
                    Vue.set(this.dictionaryEntries, entry.id, entry);
                }
            }
        },
        boldUpload(file: File): Promise<null> {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    if (typeof fileReader.result === "string") {
                        const hightlighter = new window.bunga.DetailHighlighter();
                        hightlighter.loadWordText(fileReader.result);
                        hightlighter.highlightTaxons(this.items)
                    }
                    resolve(null);
                };
                fileReader.onerror = function () {
                    reject(fileReader.error);
                }
                fileReader.readAsText(file);
            });
        },
        jsonUpload(file: File): Promise<Dataset> {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    if (typeof fileReader.result === "string") {
                        const db = JSON.parse(fileReader.result);
                        const dataset = window.bunga.Codec.decodeDataset(db);
                        resolve(dataset);
                    }
                };
                fileReader.onerror = function () {
                    reject(fileReader.error);
                }
                fileReader.readAsText(file);
            });
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
        jsonExport() {
            const json = JSON.stringify(window.bunga.Codec.encodeDataset({
                id: this.selectedBase, 
                taxons: this.items, 
                descriptors: this.descriptions, 
                extraFields: this.extraFields,
                dictionaryEntries: this.dictionaryEntries,
                books: window.bunga.Book.standard,
            }));
            download(json, "bunga.json");
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
});
</script>
