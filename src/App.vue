<template>
    <VBox class="lightgrey-background height-full">
        <HBox class="thin-border background-gradient-1 no-print centered-text">
            <div class="button-group">
                <button v-for="state in store.statesAllowList" :key="state.id" @click="removeFromAllowList(state)" class="background-color-ok">
                    {{ state.name.S }}
                </button>
                <button v-for="state in store.statesDenyList" :key="state.id" @click="removeFromDenyList(state)" class="background-color-ko">
                    {{ state.name.S }}
                </button>
            </div>
            <Spacer></Spacer>
            <div class="button-group">
                <router-link class="button" :to="'/taxons/' + store.selectedTaxon">Taxons</router-link>
                <router-link class="button" :to="'/characters/' + store.selectedCharacter">Characters</router-link>
                <router-link class="button" to="/characters-tree">Characters Tree</router-link>
                <router-link class="button" to="/dictionary">Names Dictionary</router-link>
            </div>
            <Spacer></Spacer>
            <div class="button-group">
                <button type="button" @click="openHub">Hub
                    <span v-if="connectedToHub"> (Connected)</span>
                    <span v-if="!connectedToHub"> (Disconnected)</span>
                </button>
                <button v-if="connectedToHub" type="button" @click="syncPictures" :disabled="urlsToSync.length > 0">
                    Sync pictures
                    <span v-if="urlsToSync.length > 0">{{ syncProgress }} / {{ urlsToSync.length }}</span>
                </button>
                <button v-if="connectedToHub" type="button" @click="push">Push</button>
                <button v-if="connectedToHub" type="button" @click="pull">Pull</button>
            </div>
        </HBox>
        <HBox class="start-align flex-grow-1 height-main-panel">
            <router-view></router-view>
        </HBox>
        <HBox class="thin-border background-gradient-1 no-print">
            <div class="button-group">
                <button type="button" @click="importFile">Import</button>
                <button type="button" @click="importDescriptorFile">Import with descriptors</button>
                <button type="button" @click="mergeFile">Merge</button>
                <button type="button" @click="jsonExport">Export</button>
                <button type="button" @click="exportSDD">Export SDD</button>
            </div>
            <Spacer></Spacer>
            <input class="invisible" @change="fileUpload" type="file" accept=".sdd.xml,.json,.csv,application/xml" name="import-data" id="import-data">
            <input class="invisible" @change="fileUploadDescriptors" type="file" accept=".csv" name="import-descriptors" id="import-descriptors">
            <input class="invisible" @change="fileMerge" type="file" accept=".sdd.xml,.json,application/xml" name="merge-data" id="merge-data">
            <div class="button-group">
                <button type="button" class="background-color-ok" @click="saveData">Save</button>
                <select v-if="!preloaded" v-model="selectedBase">
                    <option v-for="datasetId in datasetIds" :key="datasetId" :value="datasetId">{{ datasetId }}</option>
                </select>
                <button v-if="!preloaded" @click="renameDataset">Rename DB</button>
                <button v-if="!preloaded && datasetIds.length > 1" @click="deleteDataset">Delete DB</button>
                <button v-if="!preloaded" type="button" class="background-color-1" @click="createNewDataset">New DB</button>
                <button type="button" class="background-color-ko" @click="resetData">Reset</button>
            </div>
            <Spacer></Spacer>
            <div class="button-group">
                <button @click="indexFamilies">Index Families</button>
                <button type="button" @click="globalReplace">Replace Text</button>
                <button type="button" class="no-print" @click="displayTaxonStats">Taxons Stats</button>
                <button type="button" class="no-print background-color-1" @click="print">Print</button>
            </div>
        </HBox>
    </VBox>
</template>

<script lang="ts">
import { Character, Dataset, Taxon, allStates, createCharacter, createState, createTaxon } from "@/datatypes"; // eslint-disable-line no-unused-vars
import { encodeDataset, decodeDataset, highlightTaxonsDetails, uploadPictures } from "@/features";
import * as FS from "./fs-storage";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save";
import download from "@/tools/download";
import { Config } from './tools/config';
import { readTextFileAsync } from './tools/read-file-async';
import { forEachHierarchy, iterHierarchy } from "./datatypes/hierarchy";
import { State } from "./datatypes/types";
import { familiesWithNamesLike, Name, storefamily } from "@/db-index";
import { migrateIndexedDbStorageToFileStorage } from "./migrate-idb-to-fs";
import HBox from "@/components/toolkit/HBox.vue";
import VBox from "@/components/toolkit/VBox.vue";
import Spacer from "@/components/toolkit/Spacer.vue";
import parseCSV, { escape, factorizeColumn, transposeCSV } from "./tools/parse-csv";

export default {
    name: "App",
    components: { HBox, Spacer, VBox },
    data() {
        return {
            store: Hazo.store,
            datasetIds: [] as string[],
            selectedBase: "",
            urlsToSync: [] as string[],
            syncProgress: 0,
            preloaded: true,
            searchFamily: "",
            matchingFamilies: [] as Name[],
        };
    },
    async mounted() {
        await migrateIndexedDbStorageToFileStorage();
        const preloadedDatasetEl = document.getElementById("preloaded-dataset");
        if (preloadedDatasetEl) {
            const preloadedDatasetText = preloadedDatasetEl.innerHTML;
            this.preloaded = true;
            const registry = preloadedDatasetEl.dataset.registry;
            if (registry) {
                Config.datasetRegistry = registry;
            }
            const preloadedDataset = JSON.parse(preloadedDatasetText);
            FS.store(preloadedDataset).then(() => {
                    this.store.do("setConnectedToHub", true);
                    this.store.do("setDataset", decodeDataset(preloadedDataset));
                    this.selectedBase = preloadedDataset.id;
                });
        } else {
            this.preloaded = false;
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
            FS.list().then(dbIds => {
                this.datasetIds = dbIds;
                const dataUrl = this.$route.query.from;
                if (typeof dataUrl === "string") {
                    fetch(Config.datasetRegistry + dataUrl).then(async (data) => {
                        const dataText = await data.text();
                        const fetchedDataset = JSON.parse(dataText);
                        if (!this.datasetIds.includes(fetchedDataset.id)) {
                            this.datasetIds.push(fetchedDataset.id);
                        }
                        FS.store(fetchedDataset).then(() => {
                            this.store.do("setDataset", decodeDataset(fetchedDataset));
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
        }
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
        },
        searchFamily(val) {
            familiesWithNamesLike("S", val).then(s => { this.matchingFamilies = s });
        },
    },
    methods: {
        openHub() {
            window.open(Config.datasetRegistry);
        },
        removeFromAllowList(state: State) {
            this.store.do("removeStateFromAllowList", state);
        },
        removeFromDenyList(state: State) {
            this.store.do("removeStateFromDenyList", state);
        },
        async indexFamilies() {
            for (const family of this.dataset.taxonsHierarchy.children) {
                storefamily({ S: family.name.S, V: family.name.V ?? "", CN: family.name.CN ?? "" });
            }
        },
        syncPictures() {
            this.urlsToSync = [];
            for (const taxon of iterHierarchy(this.dataset.taxonsHierarchy)) {
                this.urlsToSync.push(...taxon.pictures.filter(pic => typeof pic.hubUrl === "undefined").map(pic => pic.url));
            }
            for (const character of iterHierarchy(this.dataset.charactersHierarchy)) {
                this.urlsToSync.push(...character.pictures.filter(pic => typeof pic.hubUrl === "undefined").map(pic => pic.url));
            }
            for (const state of allStates(this.dataset)) {
                this.urlsToSync.push(...state.pictures.filter(pic => typeof pic.hubUrl === "undefined").map(pic => pic.url));
            }
            uploadPictures(this.urlsToSync, (progress) => this.syncProgress = progress).then(results => {
                const successes = [];
                for (const result of results) {
                    if (result.status === "fulfilled") {
                        successes.push(result.value);
                    }
                }
                this.urlsToSync = [];
            });
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
            const res = await fetch(Config.datasetRegistry + "private/" + encodeURI(this.dataset.id.replace(" ", "_")) + ".hazo.json");
            if (res.status === 403) {
                alert("You should connect to the Hub to be able to download files.");
            } else {
                const json = await res.json();
                this.resetData();
                this.store.do("setDataset", decodeDataset(json));
            }
        },
        loadBase(id: string) {
            FS.load(id).then(savedDataset => {
                this.resetData();
                const ds = decodeDataset(savedDataset ?? { id });
                ds.id = id;
                this.store.do("setDataset", ds);
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
            for (const taxon of iterHierarchy(this.dataset.taxonsHierarchy)) {
                taxons[taxon.id] = taxon;
            }
            for (const character of iterHierarchy(this.dataset.charactersHierarchy)) {
                characters[character.id] = character;
            }
            if (!this.dataset.id) {
                this.dataset.id = this.selectedBase;
            }
            FS.store(encodeDataset(this.dataset)).then(() => {
                if (this.connectedToHub) {
                    this.push();
                }
            });
        },
        async renameDataset() {
            let newId = "";
            while(newId === "") {
                newId = window.prompt("New name of the dataset ?") ?? "";
                if (this.datasetIds.includes(newId)) {
                    alert("This dataset name already exists");
                    newId = "";
                }
            }
            await FS.remove(this.dataset.id);
            const i = this.datasetIds.indexOf(this.dataset.id);
            this.dataset.id = newId;
            await FS.store(encodeDataset(this.dataset));
            this.datasetIds[i] = newId;
            this.selectedBase = newId;
        },
        async deleteDataset() {
            if (typeof this.dataset !== "undefined") {
                const i = this.datasetIds.indexOf(this.dataset.id);
                this.datasetIds.splice(i, 1);
                await FS.remove(this.dataset.id);
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
        importDescriptorFile() {
            document.getElementById("import-descriptors")?.click();
        },
        mergeFile() {
            document.getElementById("merge-data")?.click();
        },
        globalReplace() {
            const pattern = window.prompt("Text pattern to replace") ?? "";
            const replacement = window.prompt("Replacement") ?? "";
            const re = new RegExp(pattern, "g");

             (this.dataset.taxonsHierarchy)

            forEachHierarchy(this.dataset.taxonsHierarchy, taxon => {
                const newDetail = taxon.detail.replace(re, replacement);
                this.store.do("setTaxon", { taxon: taxon, props: { detail: newDetail } });
            });
            forEachHierarchy(this.dataset.charactersHierarchy, character => {
                const newDetail = character.detail.replace(re, replacement);
                this.store.do("setCharacter", { character: character, props: { detail: newDetail } });
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
        async mergeProperties(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const result = await this.fileRead((e.target.files ?? [])[0]);
            if (result === null) { return; }
            const propertiesToMerge = (window.prompt("Properties to merge ?") ?? "").split(",");
            const resultsByName: Record<string, Taxon> = {};
            for (const item of Object.values(iterHierarchy(result.taxonsHierarchy))) {
                resultsByName[item.name] = item;
            }
            for (const item of iterHierarchy(this.dataset.taxonsHierarchy)) {
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
                for (const taxon of result.taxonsHierarchy.children) {
                    this.store.do("addTaxon", taxon);
                }
                for (const character of result.charactersHierarchy.children) {
                    this.store.do("addCharacter", character);
                }
            }
        },
        async fileMerge(e: Event) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const file = (e.target.files ?? [])[0];

            if (typeof file === "undefined") return;

            if (file.name.endsWith(".csv")) {
                this.mergeCsv(file);
                return;
            }

            const result = await this.fileRead(file);

            if (result !== null) {
                const existingTaxonsByIds = this.dataset.taxonsByIds;
                for (const taxon of iterHierarchy(result.taxonsHierarchy)) {
                    const existing = existingTaxonsByIds.get(taxon.id);
                    if (typeof existing !== "undefined") {
                        existing.name.S = existing.name.S ?? taxon.name.S;
                        existing.name.EN = existing.name.EN ?? taxon.name.EN;
                        existing.name.CN = existing.name.CN ?? taxon.name.CN;
                        existing.name.V = existing.name.V ?? taxon.name.V;
                        existing.pictures = existing.pictures ?? taxon.pictures;
                        existing.bookInfoByIds = existing.bookInfoByIds ?? taxon.bookInfoByIds;
                        existing.specimenLocations = existing.specimenLocations ?? taxon.specimenLocations;
                        existing.author = existing.author ?? taxon.author;
                        existing.vernacularName2 = existing.vernacularName2 ?? taxon.vernacularName2;
                        existing.name2 = existing.name2 ?? taxon.name2;
                        existing.meaning = existing.meaning ?? taxon.meaning;
                        existing.herbariumPicture = existing.herbariumPicture ?? taxon.herbariumPicture;
                        existing.website = existing.website ?? taxon.website;
                        existing.noHerbier = existing.noHerbier ?? taxon.noHerbier;
                        existing.fasc = existing.fasc ?? taxon.fasc;
                        existing.page = existing.page ?? taxon.page;
                        existing.detail = existing.detail ?? taxon.detail;
                        existing.extra = existing.extra ?? taxon.extra;
                    }
                }
            }
        },
        async fileUpload(e: Event) {
            if (!(e.target instanceof HTMLInputElement)) return;

            const result = await this.fileRead((e.target.files ?? [])[0]);
            if (typeof result === "undefined" || result === null) return;

            result.id = this.selectedBase;
            this.store.do("setDataset", result);
        },
        async fileUploadDescriptors(e: Event) {
            if (!(e.target instanceof HTMLInputElement)) return;
            const file = (e.target.files ?? [null])[0];
            if (file === null) return;
            const text = await readTextFileAsync(file);
            const lines = parseCSV(text);
            if (lines.length === 0) {
                throw new Error("descriptor file should contain at least one header line");
            }
            const [header, ...body] = lines;
            if (header.length < 2) {
                throw new Error("descriptor file header should contain at least 2 columns");
            }
            const [_family, _taxa, ...characterNames] = header;
            const [familyFact, taxaFact, ...characterColumns] = transposeCSV(body).map(factorizeColumn);
            const familyIdsByLevel = familyFact.levels.map(name => this.dataset.addTaxon(createTaxon({ name: { S: name } })).id);
            const taxaIdsByLevel: string[] = [];
            for (const [i, taxaName] of taxaFact.levels.entries()) {
                taxaIdsByLevel.push(this.dataset.addTaxon(createTaxon({ 
                    parentId: familyIdsByLevel[familyFact.values[i]], 
                    name: { S: taxaName } })).id);
            }
            for (const [charIndex, charName] of characterNames.entries()) {
                const charFactor = characterColumns[charIndex];
                const char = this.dataset.addCharacter(createCharacter({ name: { S: charName } }));
                if (char.characterType !== "discrete") { throw new Error("character should be discrete"); }
                const stateByLevel = charFactor.levels.map(name => this.dataset.addState(createState({ name: { S: name } }), char));
                for (const [i, stateValue] of charFactor.values.entries()) {
                    const taxonId = taxaIdsByLevel[taxaFact.values[i]];
                    const state = stateByLevel[stateValue];
                    this.dataset.setTaxonState(taxonId, state);
                }
            }
            this.store.do("setDataset", this.dataset);
        },
        async boldUpload(file: File) {
            const text = await readTextFileAsync(file);
            highlightTaxonsDetails(text, Object.fromEntries(this.dataset.taxonsByIds));
            return null;
        },
        async mergeCsv(file: File) {
            const text = await readTextFileAsync(file);
            const lines = parseCSV(text);
            const infosByName: Partial<Record<string, { author: string, url: string }>> = {};
            for (const [name, author, url] of lines) {
                if (name && author && url) {
                    infosByName[name] = { author, url };
                }
            }
            for (const taxon of iterHierarchy(this.dataset.taxonsHierarchy)) {
                const info = infosByName[taxon.name.S];
                if (info) {
                    taxon.author = info.author;
                    taxon.website = info.url;
                }
            }
        },
        async jsonUpload(file: File): Promise<Dataset> {
            const json = await readTextFileAsync(file);
            const db = JSON.parse(json);
            const dataset = decodeDataset(db);
            return dataset;
        },
        displayTaxonStats() {
            let csv = new Map<string, string[]>();
            csv.set("", ["Path", "NS", "Author", "NV", "名字", "subtaxa n°"]);

            function pushCsvLine(taxon: Taxon, path: string[]) {
                const childrenNo = taxon.children.length;
                for (const taxonName of path) {
                    csv.get(taxonName)![4] += childrenNo;
                }
                const cols = [path.join(" > "), taxon.name.S, taxon.author, taxon.name.V ?? "", taxon.name.CN ?? "", childrenNo];
                csv.set(taxon.name.S, cols.map(escape));
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
};
</script>
