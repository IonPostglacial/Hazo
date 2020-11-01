<template>
    <div id="app" class="vertical-flexbox lightgrey-background height-full">
    <nav class="horizontal-flexbox space-between thin-border background-gradient-1 no-print">
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
            <img class="max-width-screen max-height-screen" :src="bigImage.url" :alt="bigImage.label">
            <button v-if="bigImageIndex < bigImages.length - 1" class="background-color-1 font-size-28" v-on:click="bigImageIndex++">🡆</button>
        </div>
        <button class="background-color-1" v-on:click="minimizeImage">Minimize</button>
    </div>
    <div :class="'horizontal-flexbox start-align flex-grow-1 height-main-panel ' + (showBigImage ? 'invisible' : '')">
        <TaxonsTab v-if="selectedTab === 0"
            :taxons-hierarchy="taxonsHierarchy" :characters="charactersHierarchy"
            :selected-taxon-id="selectedTaxonId"
            :show-left-menu="showLeftMenu"
            :extra-fields="extraFields" :books="books"
            @taxon-selected="selectTaxon" @add-taxon="addTaxon" @remove-taxon="removeTaxon"
            @open-photo="maximizeImage">
        </TaxonsTab>
        <CharactersTab v-if="selectedTab === 1"
            :init-characters="charactersHierarchy"
            :show-left-menu="showLeftMenu"
            :selected-character-id="selectedCharacterId"
            @add-state="addState" @remove-state="removeState" @character-selected="selectCharacter"
            @open-photo="maximizeImage" @change-characters="changeCharactersHierarchy">
        </CharactersTab>
        <CharactersTree v-if="selectedTab === 2"
            :characters="charactersHierarchy">
        </CharactersTree>
        <WordsDictionary :init-entries="dictionaryEntries" v-if="selectedTab === 3"></WordsDictionary>
        <extra-fields-panel :showFields="showFields" :extraFields="extraFields"
            @add-extra-field="addExtraField" @delete-extra-field="deleteExtraField">
        </extra-fields-panel>
    </div>
    <section class="horizontal-flexbox space-between thin-border background-gradient-1 no-print">
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
            <button type="button" @click="globalReplace">Text Replace</button>
            <button type="button" @click="exportStats">Stats</button>
            <button type="button" @click="emptyZip">Folder Hierarchy</button>
            <button type="button" @click="texExport">Latex{{latexProgressText}}</button>
            <button type="button" class="no-print background-color-1" @click="print">Print</button>
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
import CharactersTree from "./components/CharactersTree.vue";
import WordsDictionary from "./components/WordsDictionary.vue";
import ExtraFieldsPanel from "./components/ExtraFieldsPanel.vue";
import DB from "./db-storage";
import Vue from "vue";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save.js";
import download from "./download";
import { Picture, State } from './bunga/datatypes'; // eslint-disable-line no-unused-vars
import { picturesFromPhotos } from './bunga/picture';

export default Vue.extend({
    name: "App",
    components: {
        TaxonsTab, CharactersTab, CharactersTree, WordsDictionary, ExtraFieldsPanel
    },
    data() {
        return {
            databaseIds: ["0"],
            selectedBase: "0",
            showLeftMenu: true,
            showFields: false,
            selectedTab: 0,
            selectedTaxonId: "",
            selectedCharacterId: "",
            bigImages: [{id: "", url: "", label: ""}],
            bigImageIndex: 0,
            showBigImage: false,
            tabs: [
                "Taxons",
                "Characters",
                "Characters Tree",
                "Dictionary",
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
            return this.taxonsHierarchy.itemWithId(this.selectedTaxonId);
        },
        selectedCharacter(): Character|undefined {
            return this.charactersHierarchy.itemWithId(this.selectedCharacterId);
        },
        bigImage(): Picture {
            return this.bigImages[this.bigImageIndex];
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
                const dataset = decodeDataset(savedDataset);
                for (const taxon of Object.values(dataset?.taxons ?? {})) {
                    repairPotentialCorruption(taxon);
                    this.taxonsHierarchy.add(taxon);
                }
                for (const character of Object.values(dataset?.characters ?? {})) {
                    repairPotentialCorruption(character);
                    const statesIds = new Set(), uniqueStates = [];
                    for (const state of character.states) {
                        if (!statesIds.has(state.id)) {
                            state.photos = picturesFromPhotos(state.photos);
                            uniqueStates.push(state);
                        }
                        statesIds.add(state.id);
                    }
                    character.states = uniqueStates;
                    this.charactersHierarchy.add(character);
                }
            });
        },
        print() {
            window.print()
        },
        changeCharactersHierarchy(charactershierarchy: Hierarchy<Character>) {
            this.charactersHierarchy = charactershierarchy;
        },
        changeTaxonsHierarchy(taxonsHierarchy: Hierarchy<Taxon>) {
            this.taxonsHierarchy = taxonsHierarchy;
        },
        selectTaxon(id: string) {
            this.selectedTaxonId = id;
        },
        selectCharacter(id: string) {
            this.selectedCharacterId = id;
        },
        addTaxon(taxon: Taxon) {
            this.taxonsHierarchy.add(taxon);
        },
        removeTaxon(taxon: Taxon) {
            this.taxonsHierarchy.remove(taxon);
        },
        addState(e: { state: State, character: Character }) {
            this.charactersHierarchy.itemWithId(e.character.id)!.states.push(e.state);
        },
        removeState(e: { state: State, character: Character }) {
            function removeStateFromArray(array: State[], state: State) {
                const index = array.findIndex(s => s.id === state.id);
                if (index >= 0) {
                    array.splice(index, 1);
                }
            }

            removeStateFromArray(e.character.states, e.state);
            removeStateFromArray(e.character.inapplicableStates, e.state);
            removeStateFromArray(e.character.requiredStates, e.state);
            if (e.character.inherentState?.id === e.state.id) {
                e.character.inherentState = undefined;
            }

            function removeStateFromSelection(stateSelection: Record<string, boolean|undefined>, state: State) {
                for (const stateId in stateSelection) {
                    if (stateId === state.id) {
                        delete stateSelection[stateId];
                    }
                }
            }

            for (const taxon of this.taxonsHierarchy.allItems) {
                removeStateFromSelection(taxon.statesSelection, e.state);
            }
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
        maximizeImage({ photos, index }: { photos: Picture[], index: number }) {
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
            const taxons: Record<string, Taxon> = {};
            const characters: Record<string, Character> = {};
            for (const taxon of this.taxonsHierarchy.allItems) {
                taxons[taxon.id] = taxon;
            }
            for (const character of this.charactersHierarchy.allItems) {
                characters[character.id] = character;
            }
            DB.store(encodeDataset({ id: this.selectedBase, taxons: taxons, characters: characters, extraFields: this.extraFields, dictionaryEntries: this.dictionaryEntries, books: standardBooks }));
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
                this.taxonsHierarchy.add(Object.assign({}, item, { detail: newDetail }));
            }
            for (const description of this.charactersHierarchy.allItems) {
                const newDetail = description.detail.replace(re, replacement);
                this.charactersHierarchy.add(Object.assign({}, description, { detail: newDetail }));
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
                    this.charactersHierarchy.add(character);
                }
            }
            if (typeof result.taxons !== "undefined") {
                for (const item of Object.values(result.taxons)) {
                    this.taxonsHierarchy.add(item);
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
            const zipTxt = await exportZipFolder(this.taxonsHierarchy);
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
