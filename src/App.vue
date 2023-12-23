<template>
    <VBox class="lightgrey-background height-full">
        <HBox class="thin-border background-gradient-1 no-print centered-text">
            <div class="button-group">
                <button v-for="state in statesAllowList" :key="state.id" @click="removeFromAllowList(state)" class="background-color-ok">
                    {{ state.name.S }}
                </button>
                <button v-for="state in statesDenyList" :key="state.id" @click="removeFromDenyList(state)" class="background-color-ko">
                    {{ state.name.S }}
                </button>
            </div>
            <Spacer></Spacer>
            <div class="button-group">
                <router-link class="button" :to="'/taxons/' + selectedTaxon">Taxons</router-link>
                <router-link class="button" :to="'/characters/' + selectedCharacter">Characters</router-link>
                <router-link class="button" to="/characters-tree">Characters Tree</router-link>
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
                <UploadButton @upload="importFile">Import</UploadButton>
                <DropDownButton label="" :default-up="true">
                    <VBox>
                        <UploadButton @upload="importFile">Import</UploadButton>
                        <UploadButton @upload="importDescriptorFile">Import with descriptors</UploadButton>
                        <UploadButton @upload="mergeFile">Merge</UploadButton>
                    </VBox>
                </DropDownButton>
            </div>
            <div class="button-group">
                <button type="button" @click="jsonExport">Export</button>
                <DropDownButton label="" :default-up="true">
                    <VBox>
                        <button type="button" @click="jsonExport">Export</button>
                        <button type="button" @click="exportSDD">Export SDD</button>
                    </VBox>
                </DropDownButton>
            </div>
            <Spacer></Spacer>
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
            <DropDownButton label="More Actions" :default-up="true">
                <VBox>
                    <button type="button" @click="addGeoCharacters(dataset)">Add Geo</button>
                    <button @click="indexFamilies">Index Families</button>
                    <button @click="indexCharacters">Index Characters</button>
                    <button @click="indexStates">Index States</button>
                    <button type="button" @click="globalReplace">Replace Text</button>
                    <button type="button" class="no-print" @click="displayTaxonStats">Taxons Stats</button>
                </VBox>
            </DropDownButton>
            <button type="button" class="no-print background-color-1" @click="print">
                <font-awesome-icon icon="fa-solid fa-print" />
            </button>
        </HBox>
    </VBox>
</template>

<script lang="ts">
import { Character, Dataset, Taxon, allStates, createDataset, createCharacter, createState, createTaxon, addTaxon, addCharacter, loadGeoJson, standardMaps, setTaxonState, addState } from "@/datatypes"; // eslint-disable-line no-unused-vars
import { encodeDataset, decodeDataset, highlightTaxonsDetails, uploadPictures } from "@/features";
import * as FS from "./fs-storage";
import { loadSDD } from "./sdd-load";
import saveSDD from "./sdd-save";
import download from "@/tools/download";
import { Config } from './tools/config';
import { readTextFileAsync } from './tools/read-file-async';
import { forEachHierarchy, iterHierarchy } from "./datatypes/hierarchy";
import { DiscreteCharacter, State } from "./datatypes/types";
import { Name, characterNameStore, familyNameStore, stateNameStore } from "@/db-index";
import { migrateIndexedDbStorageToFileStorage } from "./migrate-idb-to-fs";
import DropDownButton from "@/components/toolkit/DropDownButton.vue";
import HBox from "@/components/toolkit/HBox.vue";
import VBox from "@/components/toolkit/VBox.vue";
import Spacer from "@/components/toolkit/Spacer.vue";
import UploadButton from "@/components/toolkit/UploadButton.vue";
import parseCSV, { escape, factorizeColumn, transposeCSV } from "./tools/parse-csv";
import { useHazoStore } from "./store";
import { mapActions, mapState } from "pinia";

export default {
    name: "App",
    components: { DropDownButton, HBox, Spacer, UploadButton, VBox },
    data() {
        return {
            store: Hazo.store,
            datasetIds: [] as string[],
            selectedBase: "",
            urlsToSync: [] as string[],
            syncProgress: 0,
            preloaded: true,
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
                    this.setConnectedToHub(true);
                    this.store.do("setDataset", decodeDataset(preloadedDataset));
                    this.selectedBase = preloadedDataset.id;
                });
        } else {
            this.preloaded = false;
            fetch(Config.datasetRegistry).then(res => {
                if (res.ok) {
                    this.setConnectedToHub(true);
                } else {
                    const timerId = window.setInterval(() => {
                        fetch(Config.datasetRegistry).then(res => {
                            if (res.ok) {
                                this.setConnectedToHub(true);
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
        ...mapState(useHazoStore, ["connectedToHub", "selectedTaxon", "selectedCharacter", "statesAllowList", "statesDenyList"]),
        dataset(): Dataset {
            return this.store.dataset;
        },
    },
    watch: {
        selectedBase(val) {
            this.loadBase(val);
        },
    },
    methods: {
        ...mapActions(useHazoStore, ["setConnectedToHub", "removeStateFromAllowList", "removeStateFromAllowList"]),
        openHub() {
            window.open(Config.datasetRegistry);
        },
        removeFromAllowList(state: State) {
            this.removeStateFromAllowList(state);
        },
        removeFromDenyList(state: State) {
            this.removeStateFromAllowList(state);
        },
        async indexFamilies() {
            for (const family of this.dataset.taxonsHierarchy.children) {
                familyNameStore.store({ S: family.name.S, V: family.name.V ?? "", CN: family.name.CN ?? "" });
            }
        },
        async indexCharacters() {
            forEachHierarchy(this.dataset.charactersHierarchy, ch => {
                if (ch.id === "c0") { return; }
                characterNameStore.store({ S: ch.name.S, EN: ch.name.EN ?? "", CN: ch.name.CN ?? "" });
            });
        },
        async indexStates() {
            forEachHierarchy(this.dataset.charactersHierarchy, ch => {
                if (ch.id === "c0" || ch.characterType !== "discrete") { return; }
                for (const state of ch.states) {
                    stateNameStore.store({ S: state.name.S, EN: state.name.EN ?? "", CN: state.name.CN ?? "" });
                }
            });
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
        async addGeoCharacters(ds: Dataset) {
            const geoChar = createCharacter({ name: { S: "Geography" } });
            const parent = addCharacter(ds, geoChar);
            for (const map of standardMaps) {
                const character = createCharacter({ name: { S: map.name }, parentId: parent.id });
                character.preset = "map";
                const geoJson = await loadGeoJson(map.fileName);
                const stateNames: string[] = geoJson.features.map((f: any) => f.properties[map.property]);
                const ch = addCharacter(ds, character);
                stateNames
                    .map(name => createState({ name: { S: name } }))
                    .sort()
                    .forEach(state => addState(ds, state, ch as DiscreteCharacter));
            }
        },
        loadBase(id: string) {
            FS.load(id).then(async savedDataset => {
                this.resetData();
                let ds: Dataset;
                if (savedDataset.taxons.length !== 0 || savedDataset.characters.length !== 0) {
                    ds = decodeDataset(savedDataset);
                } else {
                    ds = createDataset( {
                        id,
                        taxonsHierarchy: createTaxon({ id: "t0", name: { S: "<TOP>" } }),
                        charactersHierarchy: createCharacter({ id: "c0", name: { S: "<TOP>" } }),
                        books: [], 
                        extraFields: [], 
                        statesById: new Map(),
                    });
                    const familyChar = createCharacter({ name: { S: "Family" } });
                    familyChar.preset = "family";
                    addCharacter(ds, familyChar);
                    this.addGeoCharacters(ds);
                }
                ds.id = id;
                this.store.do("setDataset", ds);
            });
        },
        print() {
            window.print();
        },
        async createNewDataset() {
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
        async readFile(file: File): Promise<Dataset | null> {
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
        async importFile(file: File) {
            const result = await this.readFile(file);
            if (typeof result === "undefined" || result === null) return;

            result.id = this.selectedBase;
            this.store.do("setDataset", result);
        },
        async importDescriptorFile(file: File) {
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
            const familyIdsByLevel = familyFact.levels.map(name => addTaxon(this.dataset, createTaxon({ name: { S: name } })).id);
            const taxaIdsByLevel: string[] = [];
            for (const [i, taxaName] of taxaFact.levels.entries()) {
                taxaIdsByLevel.push(addTaxon(this.dataset, createTaxon({ 
                    parentId: familyIdsByLevel[familyFact.values[i]], 
                    name: { S: taxaName } })).id);
            }
            for (const [charIndex, charName] of characterNames.entries()) {
                const charFactor = characterColumns[charIndex];
                const char = addCharacter(this.dataset, createCharacter({ name: { S: charName } }));
                if (char.characterType !== "discrete") { throw new Error("character should be discrete"); }
                const stateByLevel = charFactor.levels.map(name => addState(this.dataset, createState({ name: { S: name } }), char));
                for (const [i, stateValue] of charFactor.values.entries()) {
                    const taxonId = taxaIdsByLevel[taxaFact.values[i]];
                    const state = stateByLevel[stateValue];
                    setTaxonState(this.dataset, taxonId, state);
                }
            }
            this.store.do("setDataset", this.dataset);           
        },
        async mergeFile(file: File) {
            const result = await this.readFile(file);
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
        globalReplace() {
            const pattern = window.prompt("Text pattern to replace") ?? "";
            const replacement = window.prompt("Replacement") ?? "";
            const re = new RegExp(pattern, "g");

            forEachHierarchy(this.dataset.taxonsHierarchy, taxon => {
                const newDetail = taxon.detail.replace(re, replacement);
                this.store.do("setTaxon", { taxon: taxon, props: { detail: newDetail } });
            });
            forEachHierarchy(this.dataset.charactersHierarchy, character => {
                const newDetail = character.detail.replace(re, replacement);
                this.store.do("setCharacter", { character: character, props: { detail: newDetail } });
            });
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
