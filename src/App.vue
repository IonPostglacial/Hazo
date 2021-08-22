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
                <button type="button" class="no-print   " @click="displayTaxonStats">Taxons Stats</button>
                <button type="button" class="no-print background-color-1" @click="print">Print</button>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import type { Character, Dataset, Hierarchy, Taxon } from "@/datatypes";
import { encodeDataset, decodeDataset, highlightTaxonsDetails } from "@/features";
import DB from "./db-storage";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save.js";
import download from "@/tools/download";
import { ObservableMap } from './tools/observablemap';
import { Config } from './tools/config';
import Vue from "vue";
import { forEachItem } from "./datatypes/hierarchy";

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

            forEachItem(this.dataset.taxonsHierarchy, item => {
                const taxon = this.dataset.taxonsProps.get(item.id);
                const newDetail = taxon?.detail.replace(re, replacement);
                this.store.do("addTaxon", Object.assign({}, taxon, { detail: newDetail }));
            });
            forEachItem(this.dataset.charactersHierarchy, item => {
                const character = this.dataset.charProps.get(item.id);
                const newDetail = character?.detail.replace(re, replacement);
                this.store.do("addCharacter", Object.assign({}, character, { detail: newDetail }));
            });
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
        async fileMerge(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const file = (e.target.files ?? [])[0];

            if (typeof file === "undefined") return;

            if (file.name.endsWith(".csv")) {
                this.mergeCsv(file);
                return;
            }

            const result = await this.fileRead(file);

            if (result !== null) {
                forEachItem(result.taxonsHierarchy, item => {
                    const taxon = result.taxonsProps.get(item.id);
                    const existing = this.dataset.taxonsProps.get(item.id);
                    if (typeof existing !== "undefined") {
                        // TODO: set names somehow
                        existing.pictures = existing.pictures ?? taxon?.pictures;
                        existing.bookInfoByIds = existing.bookInfoByIds ?? taxon?.bookInfoByIds;
                        existing.specimenLocations = existing.specimenLocations ?? taxon?.specimenLocations;
                        existing.author = existing.author ?? taxon?.author;
                        existing.vernacularName2 = existing.vernacularName2 ?? taxon?.vernacularName2;
                        existing.name2 = existing.name2 ?? taxon?.name2;
                        existing.meaning = existing.meaning ?? taxon?.meaning;
                        existing.herbariumPicture = existing.herbariumPicture ?? taxon?.herbariumPicture;
                        existing.website = existing.website ?? taxon?.website;
                        existing.noHerbier = existing.noHerbier ?? taxon?.noHerbier;
                        existing.fasc = existing.fasc ?? taxon?.fasc;
                        existing.page = existing.page ?? taxon?.page;
                        existing.detail = existing.detail ?? taxon?.detail;
                        existing.extra = existing.extra ?? taxon?.extra;
                        for (const state of result.taxonStates(item)) {
                            this.dataset.setTaxonState(item.id, state);
                        }
                    }
                });
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
                        highlightTaxonsDetails(fileReader.result, Object.fromEntries(this.dataset.taxonsProps.entries()));
                    }
                    resolve(null);
                };
                fileReader.onerror = function () {
                    reject(fileReader.error);
                }
                fileReader.readAsText(file);
            });
        },
        mergeCsv(file: File): Promise<null> {
            return new Promise((resolve, reject) => {
                const fileReader = new FileReader();
                fileReader.onload = () => {
                    if (typeof fileReader.result === "string") {
                        const lines = fileReader.result.split("\n");
                        const infosByName: Partial<Record<string, { author: string, url: string }>> = {};
                        for (const line of lines) {
                            const [name, author, url] = line.split(";");
                            if (name && author && url) {
                                infosByName[name] = { author, url };
                            }
                        }
                        forEachItem(this.dataset.taxonsHierarchy, item => {
                            const taxon = this.dataset.taxonsProps.get(item.id);
                            const info = infosByName[item.name.S];
                            if (taxon && info) {
                                taxon.author = info.author;
                                taxon.website = info.url;
                            }
                        });
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
        displayTaxonStats() {
            let csv = new Map<string, [string, string, string, string, any]>();
            csv.set("", ["Path", "NS", "NV", "名字", "subtaxa n°"]);
            function pushCsvLine(taxon: Hierarchy, path: string[]) {
                const childrenNo = taxon.children.length;
                for (const taxonName of path) {
                    csv.get(taxonName)![4] += childrenNo;
                }
                csv.set(taxon.name.S, [path.join(" > "), taxon.name.S, taxon.name.V ?? "", taxon.name.CN ?? "", childrenNo]);
                for (const child of taxon.children) {
                    pushCsvLine(child, [...path, taxon.name.S]);
                }
            }
            for (const taxon of this.dataset.taxonsHierarchy.children) {
                pushCsvLine(taxon, []);
            }
            download([...csv.values()].map(line => line.join(",")).join("\n"), "stats.csv", this.dataset.id);
        },
        jsonExport() {
            const json = JSON.stringify(encodeDataset(this.dataset));
            download(json, "hazo.json", this.dataset.id);
        },
        exportSDD() {
            const xml = saveSDD(this.dataset);
            download(`<?xml version="1.0" encoding="UTF-8"?>` + xml.documentElement.outerHTML, "sdd.xml");
        }
    }
});
</script>
