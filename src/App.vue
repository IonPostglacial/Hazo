<template>
    <div id="app" class="vertical-flexbox lightgrey-background height-full">
        <nav class="thin-border background-gradient-1 no-print centered-text">
            <div class="button-group medium-margin inline-block">
                <router-link class="button" to="/taxons">Taxons</router-link>
                <router-link class="button" to="/characters">Characters</router-link>
                <router-link class="button" to="/characters-tree">Characters Tree</router-link>
                <router-link class="button" to="/dictionary">Dictionary</router-link>
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
                    <option v-for="databaseId in databaseIds" :key="databaseId" :value="databaseId">Database #{{ databaseId }}</option>
                </select>
                <button type="button" class="background-color-1" @click="createNewDatabase">New DB</button>
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
import { Character, Dataset, Field, Taxon } from "./bunga"; // eslint-disable-line no-unused-vars
import { encodeDataset, decodeDataset, Hierarchy, highlightTaxonsDetails, repairPotentialCorruption } from "./bunga"; // eslint-disable-line no-unused-vars
import DB from "./db-storage";
import { mapState } from "vuex";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save.js";
import download from "@/tools/download";
import { DictionaryEntry, HierarchicalItem, Picture, State } from "./bunga/datatypes"; // eslint-disable-line no-unused-vars
import { BungaVue } from "./store";
import { ObservableMap } from './tools/observablemap';

export default BungaVue.extend({
    name: "App",
    data() {
        return {
            databaseIds: ["0"],
            selectedBase: "0",
        };
    },
    mounted() {
        DB.list().then(dbIds => {
            this.databaseIds = dbIds;
            this.selectedBase = this.databaseIds[0];
        });
    },
    computed: {
        ...mapState(["dataset"]),
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
                const dataset = decodeDataset(ObservableMap, savedDataset);
                const taxons = Array.from(dataset?.taxonsHierarchy.allItems ?? []),
                    characters = Array.from(dataset?.charactersHierarchy.allItems ?? []);
                taxons.forEach(repairPotentialCorruption);
                characters.forEach(repairPotentialCorruption);

                this.$store.commit("setDataset", dataset);
            });
        },
        print() {
            window.print()
        },
        createNewDatabase() {
            const newDatabaseId = "" + this.databaseIds.length;
            this.databaseIds.push(newDatabaseId);
            this.selectedBase = newDatabaseId;
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
            DB.store(encodeDataset(this.dataset));
        },
        resetData() {
            this.$store.commit("resetData");
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
                this.$store.commit("addTaxon", Object.assign({}, taxon, { detail: newDetail }));
            }
            for (const character of this.dataset.characters) {
                const newDetail = character.detail.replace(re, replacement);
                this.$store.commit("addCharacter", Object.assign({}, character, { detail: newDetail }));
            }
        },
        async fileRead(file: File): Promise<Dataset | null> {
            let result: Dataset | null = null;
            if (file.name.endsWith(".xml")) {
                result = await loadSDD(file, this.dataset.extraFields);
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
            for (const item of this.dataset.taxons) {
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

            result.id = this.selectedBase;
            this.$store.commit("setDataset", result);
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
            download(json, "bunga.json");
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
