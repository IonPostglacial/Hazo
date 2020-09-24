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
        <TaxonsTab v-if="selectedTab === 0 || selectedTab === 1"
            :editable="selectedTab === 0"
            :taxons-hierarchy="taxonsHierarchy" :characters="charactersHierarchy"
            :selected-taxon="selectedTaxon"
            :show-left-menu="showLeftMenu"
            :extra-fields="extraFields" :books="books"
            @taxon-selected="selectTaxon" @add-taxon="addTaxon" @remove-taxon="removeTaxon"
            @open-photo="maximizeImage">
        </TaxonsTab>
        <CharactersTab v-if="selectedTab === 2"
            :init-characters="charactersHierarchy"
            :show-left-menu="showLeftMenu"
            @open-photo="maximizeImage" @change-characters="changeCharactersHierarchy">
        </CharactersTab>
        <WordsDictionary :init-entries="dictionaryEntries" v-if="selectedTab === 3"></WordsDictionary>
        <extra-fields-panel :showFields="showFields" :extraFields="extraFields"
            @add-extra-field="addExtraField" @delete-extra-field="deleteExtraField">
        </extra-fields-panel>
    </div>
    <section class="medium-margin horizontal-flexbox space-between thin-border">
        <div class="button-group">
            <button type="button" v-on:click="importFile">Import</button>
            <button type="button" v-on:click="jsonExport">Export</button>
            <button type="button" v-on:click="exportSDD">Export SDD</button>
            <button type="button" v-on:click="mergeFile">Merge</button>
        </div>
        <input class="invisible" v-on:change="fileUpload" type="file" accept=".sdd.xml,.json,.csv,application/xml" name="import-data" id="import-data">
        <input class="invisible" v-on:change="fileMerge" type="file" accept=".sdd.xml,.json,application/xml" name="merge-data" id="merge-data">
        <div class="button-group">
            <button type="button" class="background-color-ok" v-on:click="saveData">Save</button>
            <select v-model="selectedBase">
                <option v-for="databaseId in databaseIds" :key="databaseId" :value="databaseId">Database #{{ databaseId }}</option>
            </select>
            <button type="button" class="background-color-1" v-on:click="createNewDatabase">New DB</button>
            <button type="button" class="background-color-ko" v-on:click="resetData">Reset</button>
        </div>
        <div class="button-group">
            <button type="button" v-on:click="globalReplace">Text Replace</button>
            <button type="button" v-on:click="exportStats">Stats</button>
            <button type="button" v-on:click="emptyZip">Folder Hierarchy</button>
            <button type="button" v-on:click="texExport">Latex{{latexProgressText}}</button>
        </div>
    </section>
  </div>
</template>

<script lang="ts">
import { standardBooks } from "./bunga/stdcontent";
import { Character, Dataset, Field, Taxon, TexExporter } from "./bunga"; // eslint-disable-line no-unused-vars
import { encodeDataset, decodeDataset, exportZipFolder, highlightTaxonsDetails, Hierarchy, repairPotentialCorruption } from "./bunga";
import { ObservableMap } from "./observablemap";
import TaxonsTab from "./components/TaxonsTab.vue";
import CharactersTab from "./components/CharactersTab.vue";
import WordsDictionary from "./components/WordsDictionary.vue";
import ExtraFieldsPanel from "./components/ExtraFieldsPanel.vue";
import DB from "./db-storage";
import Vue from "vue";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save.js";
import download from "./download";
import cacheAssets from "./cache-assets";

export default Vue.extend({
    name: "App",
    components: {
        TaxonsTab, CharactersTab, WordsDictionary, ExtraFieldsPanel
    },
    data() {
        return {
            databaseIds: ["0"],
            selectedBase: "0",
            showLeftMenu: true,
            showFields: false,
            selectedTab: 0,
            selectedTaxonId: "",
            bigImages: [""],
            bigImageIndex: 0,
            showBigImage: false,
            tabs: [
                "Taxons",
                "Taxons Characters",
                "Characters",
                "Dictionary"
            ],
            extraFields: new Array<Field>(),
            books: standardBooks,
            taxonsHierarchy: new Hierarchy<Taxon>("myt-", new ObservableMap()),
            charactersHierarchy: new Hierarchy<Character>("myd-", new ObservableMap()),
            dictionaryEntries: {},
            latexProgressText: "",
        };
    },
    mounted() {
        DB.list().then(dbIds => this.databaseIds = dbIds);
        this.loadBase();
    },
    computed: {
        selectedTaxon(): Taxon|undefined {
            return this.taxonsHierarchy.getItemById(this.selectedTaxonId);
        }
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
                const photos: string[] = [];
                for (const taxon of savedDataset?.taxons) {
                    photos.push(...taxon.photos);
                    repairPotentialCorruption(taxon);
                    this.taxonsHierarchy.setItem(taxon);
                }
                for (const character of savedDataset?.characters) {
                    photos.push(...character.photos);
                    repairPotentialCorruption(character);
                    this.charactersHierarchy.setItem(character);
                }
                cacheAssets(photos)
                    .then(() => {
                        console.log("All photos cached.");
                    });
                    this.extraFields = savedDataset?.extraFields ?? [];
                    this.dictionaryEntries = savedDataset?.dictionaryEntries ?? {};
                });
        },
        changeCharactersHierarchy(charactershierarchy: Hierarchy<Character>) {
            this.charactersHierarchy = charactershierarchy;
        },
        changeTaxonsHierarchy(taxonsHierarchy: Hierarchy<Taxon>) {
            this.taxonsHierarchy = taxonsHierarchy;
        },
        selectTaxon(id: string) {
            console.log("taxon selected app");
            this.selectedTaxonId = id;
        },
        addTaxon(taxon: Taxon) {
            this.taxonsHierarchy.setItem(taxon);
        },
        removeTaxon(taxon: Taxon) {
            this.taxonsHierarchy.removeItem(taxon);
        },
        editExtraFields() {
            this.showFields = !this.showFields;
        },
        addExtraField({detail} : {detail: string}) {
            this.extraFields.push({ id: detail, std: false, label: detail, icon: "" });
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
            const taxons = [...this.taxonsHierarchy.topLevelItems], descriptors = [...this.charactersHierarchy.topLevelItems];
            for (const taxon of this.taxonsHierarchy.allItems) {
                if (typeof taxon.parentId !== "undefined") {
                    taxons.push(taxon);
                }
            }
            for (const description of this.charactersHierarchy.allItems) {
                if (typeof description.parentId !== "undefined") {
                    descriptors.push(description);
                }
            }
            DB.store({ id: this.selectedBase, taxons: taxons, characters: descriptors, extraFields: this.extraFields, dictionaryEntries: this.dictionaryEntries, books: standardBooks });
        },
        resetData() {
            this.taxonsHierarchy.clear();
            this.charactersHierarchy.clear();
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

            for (const item of this.taxonsHierarchy.allItems) {
                const newDetail = item.detail.replace(re, replacement);
                this.taxonsHierarchy.setItem(Object.assign({}, item, { detail: newDetail }));
            }
            for (const description of this.charactersHierarchy.allItems) {
                const newDetail = description.detail.replace(re, replacement);
                this.charactersHierarchy.setItem(Object.assign({}, description, { detail: newDetail }));
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
            for (const item of this.taxonsHierarchy.allItems) {
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
            if (typeof result.characters !== "undefined") {
                for (const character of Object.values(result.characters)) {
                    this.charactersHierarchy.setItem(character);
                }
            }
            if (typeof result.taxons !== "undefined") {
                for (const item of Object.values(result.taxons)) {
                    this.taxonsHierarchy.setItem(item);
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
                        highlightTaxonsDetails(fileReader.result, this.taxonsHierarchy.toObject());
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
                        const dataset = decodeDataset(db);
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
            for (const item of this.taxonsHierarchy.allItems) {
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
        async emptyZip() {
            const zipTxt = await exportZipFolder(this.taxonsHierarchy.toObject());
            download(zipTxt, "zip", true);
        },
        texExport() {
            const taxonToTex = new TexExporter([...this.taxonsHierarchy.allItems], this.charactersHierarchy.allItems);
            taxonToTex.onProgress((current, max) =>  { this.latexProgressText = " [" + current + " / " + max + "]" });
            taxonToTex.export().then(tex => {
                download(tex, "zip", true);
            });
        },
        jsonExport() {
            const json = JSON.stringify(encodeDataset({
                id: this.selectedBase, 
                taxons: this.taxonsHierarchy.toObject(), 
                characters: this.charactersHierarchy.toObject(), 
                extraFields: this.extraFields,
                dictionaryEntries: this.dictionaryEntries,
                books: standardBooks,
            }));
            download(json, "bunga.json");
        },
        exportSDD() {
            const xml = saveSDD({
                items: this.taxonsHierarchy,
                descriptors: this.charactersHierarchy,
                extraFields: this.extraFields,
            });
            download(`<?xml version="1.0" encoding="UTF-8"?>` + xml.documentElement.outerHTML, "sdd.xml");
        }
    }
});
</script>
