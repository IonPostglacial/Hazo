<template>
    <div id="app" class="vertical-flexbox lightgrey-background height-full">
    <nav class="horizontal-flexbox space-between thin-border background-gradient-1 no-print">
        <div class="medium-margin">
            <button type="button" @click="toggleLeftMenu">Left Menu</button>
        </div>
        <div class="button-group medium-margin">
            <button type="button" :class="{ 'selected-tab': selectedTab === 0 }" @click="selectedTab = 0">Taxons</button>
            <button type="button" :class="{ 'selected-tab': selectedTab === 1 }" @click="selectedTab = 1">Characters</button>
            <button type="button" :class="{ 'selected-tab': selectedTab === 2 }" @click="selectedTab = 2">Characters Tree</button>
            <button type="button" :class="{ 'selected-tab': selectedTab === 3 }" @click="selectedTab = 3">Dictionary</button>
        </div>
        <div class="medium-margin">
            <button type="button" @click="editExtraFields">Extra Fields</button>
        </div>
    </nav>
    <popup-galery :images="bigImages" :init-selected-image-index="bigImageIndex" :open="showBigImage" @closed="showBigImage = false">

    </popup-galery>

    <div class="horizontal-flexbox start-align flex-grow-1 height-main-panel">
        <TaxonsTab v-if="selectedTab === 0"
            :taxons-hierarchy="taxonsHierarchy" :characters="charactersHierarchy"
            :selected-taxon-id="selectedTaxonId"
            :show-left-menu="showLeftMenu"
            :extra-fields="extraFields" :books="books"
            @taxon-selected="selectTaxon"
            @open-photo="maximizeImage">
        </TaxonsTab>
        <CharactersTab v-if="selectedTab === 1"
            :characters-hierarchy="charactersHierarchy"
            :show-left-menu="showLeftMenu"
            :selected-character-id="selectedCharacterId"
            @character-selected="selectCharacter"
            @open-photo="maximizeImage">
        </CharactersTab>
        <CharactersTree v-if="selectedTab === 2"
            :characters="charactersHierarchy">
        </CharactersTree>
        <WordsDictionary :init-entries="dictionaryEntries" v-if="selectedTab === 3"></WordsDictionary>
        <extra-fields-panel :showFields="showFields" :extraFields="extraFields">
        </extra-fields-panel>
    </div>
    <section class="horizontal-flexbox space-between thin-border background-gradient-1 no-print">
        <div class="button-group">
            <button type="button" @click="importFile">Import</button>
            <button type="button" @click="mergeFile">Merge</button>
            <button type="button" @click="jsonExport">Export</button>
            <button type="button" @click="exportSDD">Export SDD</button>
        </div>
        <input class="invisible" @change="fileUpload" type="file" accept=".sdd.xml,.json,.csv,application/xml" name="import-data" id="import-data">
        <input class="invisible" @change="fileMerge" type="file" accept=".sdd.xml,.json,application/xml" name="merge-data" id="merge-data">
        <div class="button-group">
            <button type="button" class="background-color-ok" @click="saveData">Save</button>
            <select v-model="selectedBase">
                <option v-for="databaseId in databaseIds" :key="databaseId" :value="databaseId">Database #{{ databaseId }}</option>
            </select>
            <button type="button" class="background-color-1" @click="createNewDatabase">New DB</button>
            <button type="button" class="background-color-ko" @click="resetData">Reset</button>
        </div>
        <div class="button-group">
            <button type="button" @click="copyItem">Copy</button>
            <button type="button" @click="pasteItem">Paste</button>
            <button type="button" @click="globalReplace">Replace Text</button>
            <button type="button" class="no-print background-color-1" @click="print">Print</button>
        </div>
    </section>
  </div>
</template>

<script lang="ts">
import { standardBooks } from "./bunga/stdcontent";
import { Character, Dataset, Field, Taxon } from "./bunga"; // eslint-disable-line no-unused-vars
import { encodeDataset, decodeDataset, Hierarchy, highlightTaxonsDetails, repairPotentialCorruption } from "./bunga"; // eslint-disable-line no-unused-vars
import TaxonsTab from "./components/TaxonsTab.vue";
import CharactersTab from "./components/CharactersTab.vue";
import CharactersTree from "./components/CharactersTree.vue";
import WordsDictionary from "./components/WordsDictionary.vue";
import ExtraFieldsPanel from "./components/ExtraFieldsPanel.vue";
import PopupGalery from "./components/PopupGalery.vue";
import DB from "./db-storage";
import Vue from "vue";
import { mapState } from "vuex";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save.js";
import download from "./download";
import { DictionaryEntry, HierarchicalItem, Picture, State } from "./bunga/datatypes"; // eslint-disable-line no-unused-vars
import clone from "./clone";
import { BungaVue } from "./store";

export default BungaVue.extend({
    name: "App",
    components: {
        TaxonsTab, CharactersTab, CharactersTree, WordsDictionary, ExtraFieldsPanel, PopupGalery,
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
            copiedItem: undefined as HierarchicalItem<Taxon|Character>|undefined,
        };
    },
    mounted() {
        DB.list().then(dbIds => this.databaseIds = dbIds);
        this.loadBase();
    },
    computed: {
        ...mapState(["extraFields", "books", "taxonsHierarchy", "charactersHierarchy", "dictionaryEntries"]),
        selectedTaxon(): Taxon|undefined {
            return this.taxonsHierarchy.itemWithId(this.selectedTaxonId);
        },
        selectedCharacter(): Character|undefined {
            return this.charactersHierarchy.itemWithId(this.selectedCharacterId);
        },
        selectedItem(): HierarchicalItem<Taxon|Character>|undefined {
            switch(this.selectedTab) {
                case 0:
                    return this.selectedTaxon;
                case 1:
                    return this.selectedCharacter;
                default:
                    return undefined;
            }
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
                const taxons = Object.values(dataset?.taxons ?? {}),
                    characters = Object.values(dataset?.characters ?? {}),
                    dictionaryEntries = Object.values(dataset?.dictionaryEntries ?? {});
                taxons.forEach(repairPotentialCorruption);
                characters.forEach(repairPotentialCorruption);

                this.$store.commit("addTaxons", taxons);
                this.$store.commit("addCharacters", characters);
                this.$store.commit("addDictionaryEntries", dictionaryEntries);
            });
        },
        copyItem() {
            if (typeof this.selectedItem !== "undefined") {
                this.copiedItem = clone(this.selectedItem);
                this.copiedItem.id = "";
            } else {
                console.log("Nothing to copy here.");
                alert("Nothing to copy here.");
            }
        },
        pasteItem() {
            if (typeof this.selectedItem !== "undefined" && typeof this.copiedItem !== "undefined") {
                if (this.selectedItem.type === this.copiedItem.type) {
                    const id = this.selectedItem.id;
                    Object.assign(this.selectedItem, this.copiedItem);
                    this.selectedItem.id = id;
                } else {
                    alert(`You cannot copy a ${this.copiedItem.type} into a ${this.selectedItem.type}`);
                }
            } else {
                alert("Nothing to paste here.");
            }
        },
        print() {
            window.print()
        },
        changeCharactersHierarchy(charactershierarchy: Hierarchy<Character>) {
            this.charactersHierarchy = charactershierarchy;
        },
        selectTaxon(id: string) {
            this.selectedTaxonId = id;
        },
        selectCharacter(id: string) {
            this.selectedCharacterId = id;
        },
        editExtraFields() {
            this.showFields = !this.showFields;
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
