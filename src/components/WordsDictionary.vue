<template>
    <div class="flex-grow-1">
        <div class="horizontal-flexbox height-full">
            <div class="scroll height-full">
                <div class="white-background stick-to-top horizontal-flexbox">
                    <input type="search" v-model="entriesFilter" class="flex-grow-1" name="searchEntries" id="searchEntries" placeholder="Filter">
                </div>
                <table class="white-background medium-padding scroll">
                    <tr class="white-background"><th></th><th>名词</th><th>Name</th><th>Nom</th></tr>
                    <tr v-for="entry in entriesToDisplay" :key="entry.id" class="blue-hover relative">
                        <td><input type="radio" name="selectedEntry" v-model="selectedEntryId" :id="'selectedEntry-' + entry.id" :value="entry.id"></td>
                        <td><label :for="'selectedEntry-' + entry.id" class="full-width">{{ entry.name.CN }}</label></td>
                        <td><label :for="'selectedEntry-' + entry.id" class="full-width">{{ entry.name.EN }}</label></td>
                        <td><label :for="'selectedEntry-' + entry.id" class="full-width">{{ entry.name.FR }}</label></td>
                    </tr>
                </table>
                <add-item @add-item="addEntry"></add-item>
            </div>
            <div class="vertical-flexbox flex-grow-1 white-background medium-padding scroll height-full">
                <div>
                    <input type="file" class="invisible" name="csvFileChooser" id="csvFileChooser" v-on:change="uploadCSV">
                    <div class="button-group">
                        <button type="button" v-on:click="importCSV">Import CSV</button>
                        <button type="button" v-on:click="exportCSV">Export CSV</button>
                    </div>
                </div>
                <div v-if="selectedEntry">
                    <div class="horizontal-flexbox">
                        <div class="form-grid">
                            <label class="item-property">名词</label>
                            <input type="text" spellcheck="false" v-model="selectedEntry.name.CN" />
                            <label class="item-property">Name</label>
                            <input type="text" spellcheck="false" v-model="selectedEntry.name.EN" />
                            <label class="item-property">Nom</label>
                            <input type="text" spellcheck="false" v-model="selectedEntry.name.FR" />
                            <label class="item-property">Illustration</label>
                            <input type="text" spellcheck="false" v-model="selectedEntry.url" />
                        </div>
                        <div>
                            <img class="medium-max-width medium-max-height" :src="selectedEntry.url">
                        </div>
                    </div>
                    <label class="item-property">解释</label><br/>
                    <ckeditor :editor="editor" :config="editorConfig" v-model="selectedEntry.defCN"></ckeditor>
                    <label class="item-property">Definition</label><br/>
                    <ckeditor :editor="editor" :config="editorConfig" v-model="selectedEntry.defEN"></ckeditor>
                    <label class="item-property">Définition</label><br/>
                    <ckeditor :editor="editor" :config="editorConfig" v-model="selectedEntry.defFN"></ckeditor>     
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import parseCSV from "@/tools/parse-csv";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
import AddItem from "./AddItem.vue";
import TreeMenu from "./TreeMenu.vue";
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import Vue from "vue";  // eslint-disable-line no-unused-vars
import download from "@/tools/download";
import { DictionaryEntry, IMap } from "@/datatypes";  // eslint-disable-line no-unused-vars
import { filter } from "@/tools/iter";

export default Vue.extend({
    name: "WordsDictionary",
    components: {
        ckeditor: CKEditor.component,
        AddItem,
        TreeMenu,
    },
    data() {
        return {
            store: Hazo.store,
            selectedEntryId: "",
            editor: ClassicEditor,
            editorConfig: {},
            entriesFilter: "",
        };
    },
    computed: {
        dictionaryEntries(): IMap<DictionaryEntry> {
            return this.store.dataset.dictionaryEntries;
        },
        selectedEntry(): DictionaryEntry|undefined {
            return this.dictionaryEntries.get(this.selectedEntryId);
        },
        entriesToDisplay(): Iterable<DictionaryEntry> {
            const entries = Array.from(this.dictionaryEntries.values());
            if (this.entriesFilter !== "") {
                return entries.filter(entry => {
                    return ["CN", "EN", "FR"].
                        map(field => (entry.name as any)[field]).
                        some(name => name?.toUpperCase().startsWith(this.entriesFilter?.toUpperCase()) ?? false);
                });
            } else {
                return entries;
            }
        },
    },
    methods: {
        selectEntry(id: string) {
            this.selectedEntryId = id;
        },
        importCSV() {
            const csvFileChooser = document.getElementById("csvFileChooser")!;
            csvFileChooser.click();
        },
        exportCSV() {
            let csv = "\uFEFFnameCN,nameEN,defCN,defEN,nameFR,defFN,url\n";
            function escapeValue(value: string) {
                let escapedValue = value;
                if (escapedValue.includes(",") || escapedValue.includes("\n")) {
                    escapedValue = escapedValue.replace('"', '""');
                    escapedValue = `"${escapedValue}"`;
                }
                return escapedValue;
            }
            for (const e of this.dictionaryEntries.values()) {
                csv += [e.name.CN, e.name.EN, e.defCN, e.defEN, e.name.FR, e.defFR, e.url].map(escapeValue).join(",") + "\n";
            }
            download(csv, "csv");
        },
        addEntry(e: { detail: string[] }) {
            const [nameCN, nameEN, nameFR] = e.detail;
            const id = Date.now();
            this.store.do("addDictionaryEntry", {
                id: id.toString(), 
                name: { CN: nameCN ?? "", EN: nameEN ?? "", FR: nameFR ?? ""}, 
                defCN: "", defEN: "", defFR: "", url: ""
            });
        },
        deleteEntry(e: { itemId: string}) {
            const entryToDelete = this.dictionaryEntries.get(e.itemId);
            if (typeof entryToDelete !== "undefined") {
                this.store.do("removeDictionaryEntry", entryToDelete);
            } else {
                console.warn(`Trying to delete character with id ${e.itemId} which doesn't exist.`, this.dictionaryEntries);
            }
        },
        uploadCSV(e: InputEvent) {
            const target = e.target as HTMLInputElement;
            const file = (target.files ?? [])[0];
            const fileReader = new FileReader();
            fileReader.onload = () => {
                if (typeof fileReader.result === "string") {
                    const csv = parseCSV(fileReader.result);
                    for (const [id, [nameCN, nameEN, defCN, defEN]] of csv.entries()) {
                        if (id > 0) {
                            this.dictionaryEntries.set(""+id, { id: id.toString(), name: {CN: nameCN, EN: nameEN, FR: ""}, defCN, defEN, defFR: "", url: "" });
                        }
                    }
                }
            };
            fileReader.readAsText(file);
        }
    }
});
</script>