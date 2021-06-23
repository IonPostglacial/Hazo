<template>
    <div id="app" class="vertical-flexbox lightgrey-background height-full">
        <nav class="thin-border background-gradient-1 no-print centered-text">
            <div class="button-group inline-block">
                <router-link class="button" to="/taxons">Taxons</router-link>
                <router-link class="button" to="/characters">Characters</router-link>
                <router-link class="button" to="/characters-tree">Characters Tree</router-link>
                <router-link class="button" to="/dictionary">Dictionary</router-link>
            </div>
            <div class="button-group inline-block float-right">
                <button type="button" @click="openHub">Hub
                    <span v-if="connectedToHub"> (Connected)</span>
                    <span v-if="!connectedToHub"> (Disconnected)</span>
                </button>
                <button v-if="connectedToHub" type="button" @click="push">Push</button>
                <button v-if="connectedToHub" type="button" @click="pull">Pull</button>
            </div>
        </nav>
        <div class="horizontal-flexbox start-align flex-grow-1 height-main-panel">
            <router-view></router-view>
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
                    <option v-for="datasetId in datasetIds" :key="datasetId" :value="datasetId">{{ datasetId }}</option>
                </select>
                <button @click="renameDataset">Rename DB</button>
                <button v-if="datasetIds.length > 1" @click="deleteDataset">Delete DB</button>
                <button type="button" class="background-color-1" @click="createNewDataset">New DB</button>
                <button type="button" class="background-color-ko" @click="resetData">Reset</button>
            </div>
            <div class="button-group">
                <button type="button" @click="globalReplace">Replace Text</button>
                <button type="button" class="no-print background-color-1" @click="print">Print</button>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import { Character, Dataset, Taxon } from "@/datatypes"; // eslint-disable-line no-unused-vars
import { encodeDataset, decodeDataset, highlightTaxonsDetails } from "@/features";
import DB from "./db-storage";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save.js";
import download from "@/tools/download";
import { ObservableMap } from './tools/observablemap';
import { Config } from './tools/config';
import Vue from "vue";

export default Vue.extend({
    name: "App",
    data() {
        return {
            store: Hazo.store,
            datasetIds: [] as string[],
            selectedBase: "",
        };
    },
    mounted() {
        fetch(Config.datasetRegistry).then(res => {
            if (res.ok) {
                this.store.do("setConnectedToHub", true);
            } else {
                const timerId = window.setInterval(() => {
                    fetch(Config.datasetRegistry).then(res => {
                        if (res.ok) {
                            this.store.do("setConnectedToHub", true);
                            window.clearInterval(timerId);
                        }
                    })
                }, 300_000);
            }
        });
        DB.list().then(dbIds => {
            this.datasetIds = dbIds;
            const dataUrl = this.$route.query.from;
            if (typeof dataUrl === "string") {
                fetch(Config.datasetRegistry + dataUrl).then(async (data) => {
                    const dataText = await data.text();
                    const fetchedDataset = JSON.parse(dataText);
                    if (!this.datasetIds.includes(fetchedDataset.id)) {
                        this.datasetIds.push(fetchedDataset.id);
                    }
                    DB.store(fetchedDataset).then(() => {
                        this.store.do("setDataset", decodeDataset(ObservableMap, fetchedDataset));
                        this.selectedBase = fetchedDataset.id;
                    });
                });
            } else {
                if (this.datasetIds.length === 0) {
                    this.createNewDataset();
                } else {
                    this.selectedBase = this.datasetIds[0];
                }
            }
        });
    },
    computed: {
        dataset(): Dataset {
            return this.store.dataset;
        },
        connectedToHub(): boolean {
            return this.store.connectedToHub;
        },
    },
    watch: {
        selectedBase(val) {
            this.loadBase(val);
        }
    },
    methods: {
        openHub() {
            window.open(Config.datasetRegistry);
        },
        async push() {
            const json = JSON.stringify(encodeDataset(this.dataset));
            const data = new FormData();
            data.append("db-file-upload", new Blob([json], {type : "application/json"}), this.dataset.id + ".hazo.json");
            const res = await fetch(Config.datasetRegistry + "api/datasets", {
                method: "POST",
                body: data,
            });
            if (res.status === 403) {
                alert("You should connect to the Hub to be able to upload files.");
            }
        },
        async pull() {
            const res = await fetch(Config.datasetRegistry + "private/" + encodeURI(this.dataset.id) + ".hazo.json");
            if (res.status === 403) {
                alert("You should connect to the Hub to be able to download files.");
            } else {
                const json = await res.json();
                this.resetData();
                this.store.do("setDataset", decodeDataset(ObservableMap, json));
            }
        },
        loadBase(id: string) {
            DB.load(id).then(savedDataset => {
                this.resetData();
                this.store.do("setDataset", decodeDataset(ObservableMap, savedDataset ?? { id }));
            });
        },
        print() {
            window.print();
        },
        createNewDataset() {
            let manualId = window.prompt("Dataset Id ?") ?? "#";
            while (this.datasetIds.includes(manualId)) {
                manualId = manualId + " (other)";
            }
            this.datasetIds.push(manualId);
            this.selectedBase = manualId;
        },
        saveData() {
            const taxons: Record<string, Taxon> = {};
            const characters: Record<string, Character> = {};
            for (const taxon of this.dataset.taxons) {
                taxons[taxon.id] = taxon;
            }
            for (const character of this.dataset.characters) {
                characters[character.id] = character;
            }
            DB.store(encodeDataset(this.dataset)).then(() => {
                if (this.connectedToHub) {
                    this.push();
                }
            });
        },
        renameDataset() {
            let newId = "";
            while(newId === "") {
                newId = window.prompt("New name of the dataset ?") ?? "";
                if (this.datasetIds.includes(newId)) {
                    alert("This dataset name already exists");
                    newId = "";
                }
            }
            DB.delete(this.dataset.id);
            const i = this.datasetIds.indexOf(this.dataset.id);
            this.dataset.id = newId;
            DB.store(encodeDataset(this.dataset));
            this.datasetIds[i] = newId;
            this.selectedBase = newId;
        },
        deleteDataset() {
            if (typeof this.dataset !== "undefined") {
                const i = this.datasetIds.indexOf(this.dataset.id);
                this.datasetIds.splice(i, 1);
                DB.delete(this.dataset.id);
                if (this.datasetIds.length > 0) {
                    this.selectedBase = this.datasetIds[0];
                }
            }
        },
        resetData() {
            this.store.do("resetData");
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

            for (const taxon of this.dataset.taxons) {
                const newDetail = taxon.detail.replace(re, replacement);
                this.store.do("addTaxon", Object.assign({}, taxon, { detail: newDetail }));
            }
            for (const character of this.dataset.characters) {
                const newDetail = character.detail.replace(re, replacement);
                this.store.do("addCharacter", Object.assign({}, character, { detail: newDetail }));
            }
        },
        async fileRead(file: File): Promise<Dataset | null> {
            let result: Dataset | null = null;
            if (file.name.endsWith(".xml")) {
                result = await loadSDD(file, this.dataset.extraFields);
            } else if (file.name.endsWith(".json")) {
                result = await this.jsonUpload(file);
            } else if (file.name.endsWith(".bold.csv")) {
                result = await this.boldUpload(file);
            }
            return result;
        },
        async mergeProperties(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const result = await this.fileRead((e.target.files ?? [])[0]);
            const propertiesToMerge = (window.prompt("Properties to merge ?") ?? "").split(",");
            const resultsByName: Record<string, Taxon> = {};
            for (const item of Object.values(result?.taxons ?? {})) {
                resultsByName[item.name] = item;
            }
            for (const item of this.dataset.taxons) {
                const newInfo: any = resultsByName[item.name.S], anyItem: any = item;
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
        async fileMergeHierarchies(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const result = await this.fileRead((e.target.files ?? [])[0]);

            if (result !== null) {
                for (const taxon of result.taxonsHierarchy.topLevelItems) {
                    this.store.do("addTaxonHierarchy", result.taxonsHierarchy.extractHierarchy(taxon));
                }
                for (const character of result.charactersHierarchy.topLevelItems) {
                    this.store.do("addCharacterHierarchy", result.charactersHierarchy.extractHierarchy(character));
                }
            }
        },
        async fileMerge(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const result = await this.fileRead((e.target.files ?? [])[0]);

            if (result !== null) {
                for (const taxon of result.taxonsHierarchy.allItems) {
                    const existing = this.dataset.taxonsHierarchy.itemWithId(taxon.id);
                    if (typeof existing !== "undefined") {
                        existing.name.S ??= taxon.name.S;
                        existing.name.EN ??= taxon.name.EN;
                        existing.name.CN ??= taxon.name.CN;
                        existing.pictures ??= taxon.pictures;
                        existing.name.V ??= taxon.name.V;
                        existing.bookInfoByIds ??= taxon.bookInfoByIds;
                        existing.specimenLocations ??= taxon.specimenLocations;
                        existing.author ??= taxon.author;
                        existing.vernacularName2 ??= taxon.vernacularName2;
                        existing.name2 ??= taxon.name2;
                        existing.meaning ??= taxon.meaning;
                        existing.herbariumPicture ??= taxon.herbariumPicture;
                        existing.website ??= taxon.website;
                        existing.noHerbier ??= taxon.noHerbier;
                        existing.fasc ??= taxon.fasc;
                        existing.page ??= taxon.page;
                        existing.detail ??= taxon.detail;
                        existing.extra ??= taxon.extra;
                        for (const state of result.taxonStates(taxon)) {
                            this.dataset.statesByTaxons.add(existing.id, state.id);
                        }
                    }
                }
            }
        },
        async fileUpload(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const result = await this.fileRead((e.target.files ?? [])[0]);
            if (typeof result === "undefined" || result === null) return;

            result.id = this.selectedBase;
            this.store.do("setDataset", result);
        },
        boldUpload(file: File): Promise<null> {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    if (typeof fileReader.result === "string") {
                        highlightTaxonsDetails(fileReader.result, this.dataset.taxonsHierarchy.toObject());
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
                        const dataset = decodeDataset(ObservableMap, db);
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
            const json = JSON.stringify(encodeDataset(this.dataset));
            download(json, "hazo.json", this.dataset.id);
        },
        exportSDD() {
            const xml = saveSDD({
                items: this.dataset.taxonsHierarchy.toObject(),
                descriptors: this.dataset.charactersHierarchy.toObject(),
                extraFields: this.dataset.extraFields,
            });
            download(`<?xml version="1.0" encoding="UTF-8"?>` + xml.documentElement.outerHTML, "sdd.xml");
        }
    }
});
</script>
