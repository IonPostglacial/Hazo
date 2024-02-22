<template>
    <VBox class="lightgrey-background height-full">
        <HBox class="thin-border background-gradient-1 no-print centered-text">
            <div class="button-group">
                <button v-for="state in statesAllowList" :key="state.id" @click="removeStateFromAllowList(state)" class="background-color-ok">
                    {{ state.name.S }}
                </button>
                <button v-for="state in statesDenyList" :key="state.id" @click="removeStateFromDenyList(state)" class="background-color-ko">
                    {{ state.name.S }}
                </button>
            </div>
            <Spacer></Spacer>
            <div class="button-group">
                <router-link class="button" :to="'/taxons/' + selectedTaxon">Taxons</router-link>
                <router-link class="button" :to="'/characters/' + selectedCharacter">Characters</router-link>
                <router-link class="button" to="/characters-tree">Characters Tree</router-link>
                <router-link class="button" to="/comparison">Comparison</router-link>
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
                    <button type="button" @click="addGeoCharacters">Add Geo</button>
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
import { Character, Dataset, Taxon, createCharacter, createState, createTaxon, loadGeoJson, mapModel, standardMaps } from "@/datatypes";
import { createDataset, pathToItem } from "@/datatypes/Dataset"; 
import { decodeDataset, highlightTaxonsDetails, uploadPictures } from "@/features";
import * as FS from "./fs-storage";
import { loadSDD } from "./sdd-load";
import download from "@/tools/download";
import { Config } from './tools/config';
import { readTextFileAsync } from './tools/read-file-async';
import { forEachHierarchy, iterHierarchy } from "./datatypes/hierarchy";
import { DiscreteCharacter, Item } from "./datatypes/types";
import { Name } from "@/db-index";
import { migrateIndexedDbStorageToFileStorage } from "./migrate-idb-to-fs";
import DropDownButton from "@/components/toolkit/DropDownButton.vue";
import HBox from "@/components/toolkit/HBox.vue";
import VBox from "@/components/toolkit/VBox.vue";
import Spacer from "@/components/toolkit/Spacer.vue";
import UploadButton from "@/components/toolkit/UploadButton.vue";
import parseCSV, { escape, factorizeColumn, transposeCSV } from "./tools/parse-csv";
import { useHazoStore } from "@/stores/hazo";
import { useDatasetStore } from "./stores/dataset";
import { mapActions, mapState } from "pinia";
import makeid from "./tools/makeid";

export default {
    name: "App",
    components: { DropDownButton, HBox, Spacer, UploadButton, VBox },
    data() {
        return {
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
                this.setDataset(decodeDataset(preloadedDataset));
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
                            this.setDataset(decodeDataset(fetchedDataset));
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
        ...mapState(useDatasetStore, ["charactersHierarchy", "extraFields", "id", "taxonsByIds", "taxonsHierarchy"]),
    },
    watch: {
        selectedBase(val) {
            this.loadBase(val);
        },
    },
    methods: {
        ...mapActions(useHazoStore, ["index", "indexDataset", "setConnectedToHub", "removeStateFromAllowList", "removeStateFromAllowList"]),
        ...mapActions(useDatasetStore, ["addCharacter", "setCharacterPicture", "addState", "setStatePicture", "addTaxon", "setTaxonPicture", "allStates", "characterWithId", "encodeToHazoJson", "encodeToSdd", "resetData", "setCharacter", "setDataset", "setTaxon", "setTaxonState"]),
        openHub() {
            window.open(Config.datasetRegistry);
        },
        syncPictures() {
            this.urlsToSync = [];
            const invalidUrl = (url: string|undefined): boolean => {
                return typeof url === "undefined" || url.endsWith("/embed");
            }
            const itemsByUrl = new Map<string, Item[]>();
            const preparePictures = (item: Item) => {
                const urlsToSync: string[] = [];
                item.pictures.filter(pic => invalidUrl(pic.hubUrl)).forEach(pic => {
                    let items = itemsByUrl.get(pic.url);
                    if (typeof items === "undefined") {
                        items = [];
                    }
                    items.push(item);
                    itemsByUrl.set(pic.url, items);
                    urlsToSync.push(pic.url);
                });
                this.urlsToSync.push(...urlsToSync);
            }
            forEachHierarchy(this.taxonsHierarchy, preparePictures);
            forEachHierarchy(this.charactersHierarchy, preparePictures);
            for (const state of this.allStates()) {
                preparePictures(state);
            }
            uploadPictures(this.urlsToSync, (progress) => this.syncProgress = progress).then(results => {
                for (const result of results) {
                    if (result.status === "fulfilled") {
                        itemsByUrl.get(result.value.src)?.forEach(item => {
                            const picture = {
                                type: "picture" as const,
                                id: "m-" + makeid(16),
                                path: pathToItem(item),
                                url: result.value.src,
                                label: result.value.src,
                                hubUrl: result.value.response,
                            };
                            const index = item.pictures.findIndex(pic => pic.url === result.value.src);
                            switch (item.type) {
                                case "taxon":
                                    this.setTaxonPicture({ taxon: item, index, picture });
                                    break;
                                case "character":
                                    this.setCharacterPicture({ character: item, index, picture });
                                    break;
                                case "state":
                                    const character = this.characterWithId(item.path.at(-1));
                                    this.setStatePicture({ character, state: item, index, picture });
                                    break;
                            }
                        });
                    }
                }
                this.urlsToSync = [];
            });
        },
        async push() {
            const json = JSON.stringify(this.encodeToHazoJson());
            const data = new FormData();
            data.append("db-file-upload", new Blob([json], {type : "application/json"}), this.selectedBase + ".hazo.json");
            const res = await fetch(Config.datasetRegistry + "api/datasets", {
                method: "POST",
                body: data,
            });
            if (res.status === 403) {
                alert("You should connect to the Hub to be able to upload files.");
            }
        },
        async pull() {
            const res = await fetch(Config.datasetRegistry + "private/" + encodeURI(this.selectedBase.replace(" ", "_")) + ".hazo.json");
            if (res.status === 403) {
                alert("You should connect to the Hub to be able to download files.");
            } else {
                const json = await res.json();
                this.resetData();
                this.setDataset(decodeDataset(json));
            }
        },
        async addGeoCharacters() {
            const geoChar = createCharacter({ 
                path: ["c0"], 
                name: { S: "Geographie", EN: "Geography", CN: "地理分布" }, 
                preset: "map", 
                mapFile: mapModel.fileName,
            });
            const parent = this.addCharacter(geoChar);
            for (const map of standardMaps) {
                const character = createCharacter({ name: { S: map.name, EN: map.nameEN, CN: map.nameCN }, path: pathToItem(parent), preset: "map", mapFile: map.fileName });
                const geoJson = await loadGeoJson(map.fileName);
                const stateNames: string[] = geoJson.features.map((f: any) => f.properties[map.property]);
                const ch = this.addCharacter(character);
                stateNames
                    .map(name => createState({ name: { S: name }, path: pathToItem(ch) }))
                    .sort()
                    .forEach(state => this.addState({ state, character: ch as DiscreteCharacter }));
            }
        },
        loadBase(id: string) {
            FS.load(id).then(async savedDataset => {
                let ds: Dataset;
                if (savedDataset.taxons.length !== 0 || savedDataset.characters.length !== 0) {
                    ds = decodeDataset(savedDataset);
                    ds.id = id;
                    this.indexDataset(ds);
                    this.setDataset(ds);
                } else {
                    ds = createDataset( {
                        id,
                        taxonsHierarchy: createTaxon({ id: "t0", path: [], name: { S: "<TOP>" } }),
                        charactersHierarchy: createCharacter({ id: "c0", path: [], name: { S: "<TOP>" } }),
                        books: [], 
                        extraFields: [], 
                        statesById: new Map(),
                    });
                    const familyChar = createCharacter({ path: ["c0"], name: { S: "Family" }, preset: "family" });
                    ds.id = id;
                    this.setDataset(ds);
                    this.addCharacter(familyChar);
                    this.addGeoCharacters();
                }
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
            this.index(true);
            const items: Record<string, Taxon> = {};
            const characters: Record<string, Character> = {};
            for (const taxon of iterHierarchy(this.taxonsHierarchy)) {
                items[taxon.id] = taxon;
            }
            for (const character of iterHierarchy(this.charactersHierarchy)) {
                characters[character.id] = character;
            }
            FS.store(this.encodeToHazoJson()).then(() => {
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
            await FS.remove(this.selectedBase);
            const i = this.datasetIds.indexOf(this.selectedBase);
            this.selectedBase = newId;
            await FS.store(this.encodeToHazoJson());
            this.datasetIds[i] = newId;
            this.selectedBase = newId;
        },
        async deleteDataset() {
            const i = this.datasetIds.indexOf(this.selectedBase);
            this.datasetIds.splice(i, 1);
            await FS.remove(this.selectedBase);
            if (this.datasetIds.length > 0) {
                this.selectedBase = this.datasetIds[0];
            }
        },
        async readFile(file: File): Promise<Dataset | null> {
            let result: Dataset | null = null;
            if (file.name.endsWith(".xml")) {
                result = await loadSDD(file, this.extraFields);
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
            this.setDataset(result);
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
            const familyIdsByLevel = familyFact.levels.map(name => this.addTaxon(createTaxon({ name: { S: name }, path: ["t0"] })));
            const taxaByLevel: Taxon[] = [];
            for (const [i, taxaName] of taxaFact.levels.entries()) {
                taxaByLevel.push(this.addTaxon(createTaxon({ 
                    path: pathToItem(familyIdsByLevel[familyFact.values[i]]), 
                    name: { S: taxaName } })));
            }
            for (const [charIndex, charName] of characterNames.entries()) {
                const charFactor = characterColumns[charIndex];
                const character = this.addCharacter(createCharacter({ name: { S: charName }, path: ["c0"] }));
                if (character.characterType !== "discrete") { throw new Error("character should be discrete"); }
                const stateByLevel = charFactor.levels.map(name => this.addState({ 
                    state: createState({ name: { S: name }, path: pathToItem(character) }), 
                    character 
                }));
                for (const [i, stateValue] of charFactor.values.entries()) {
                    const taxonId = taxaByLevel[taxaFact.values[i]];
                    const state = stateByLevel[stateValue];
                    this.setTaxonState({ taxon: taxonId, state, has: true });
                }
            }          
        },
        async mergeFile(file: File) {
            const result = await this.readFile(file);
            if (result === null) { return; }
            const propertiesToMerge = (window.prompt("Properties to merge ?") ?? "").split(",");
            const resultsByName: Record<string, Taxon> = {};
            for (const item of Object.values(iterHierarchy(result.taxonsHierarchy))) {
                resultsByName[item.name] = item;
            }
            for (const item of iterHierarchy(this.taxonsHierarchy)) {
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

            forEachHierarchy(this.taxonsHierarchy, taxon => {
                const newDetail = taxon.detail.replace(re, replacement);
                this.setTaxon({ taxon: taxon, props: { detail: newDetail } });
            });
            forEachHierarchy(this.charactersHierarchy, character => {
                const newDetail = character.detail.replace(re, replacement);
                this.setCharacter({ character: character, props: { detail: newDetail } });
            });
        },
        async boldUpload(file: File) {
            const text = await readTextFileAsync(file);
            highlightTaxonsDetails(text, Object.fromEntries(this.taxonsByIds));
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
            for (const taxon of iterHierarchy(this.taxonsHierarchy)) {
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
            for (const taxon of this.taxonsHierarchy.children) {
                pushCsvLine(taxon, []);
            }
            download([...csv.values()].map(line => line.join(",")).join("\n"), "stats.csv", this.selectedBase);
        },
        jsonExport() {
            const json = JSON.stringify(this.encodeToHazoJson());
            download(json, "hazo.json", this.selectedBase);
        },
        exportSDD() {
            const xml = this.encodeToSdd();
            download(`<?xml version="1.0" encoding="UTF-8"?>` + xml.documentElement.outerHTML, "sdd.xml");
        }
    }
};
</script>