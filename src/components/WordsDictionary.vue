<template>
    <div class="flex-grow-1">
        <div class="horizontal-flexbox height-full">
            <div class="scroll height-full">
                <div class="white-background stick-to-top horizontal-flexbox">
                    <input type="search" v-model="entriesFilter" class="flex-grow-1" name="searchEntries" id="searchEntries" placeholder="Filter">
                </div>
                <table class="white-background medium-padding scroll full-width">
                    <tr class="white-background"><th></th><th>名词</th><th>Name</th><th>Nom</th><th>&nbsp;</th></tr>
                    <tr v-for="(entry, index) in entriesToDisplay" :key="entry.id" class="relative">
                        <td class="blue-hover-line"><input type="radio" name="selectedEntry" v-model="selectedEntryIndex" :id="'selectedEntry-' + index" :value="index"></td>
                        <td class="blue-hover-line"><label :for="'selectedEntry-' + index" class="inline-block full-width">{{ entry.name.CN }}</label></td>
                        <td class="blue-hover-line"><label :for="'selectedEntry-' + index" class="inline-block full-width">{{ entry.name.EN }}</label></td>
                        <td class="blue-hover-line"><label :for="'selectedEntry-' + index" class="inline-block full-width">{{ entry.name.FR }}</label></td>
                        <td><div class="close" @click="deleteEntryAt(index)"></div></td>
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
            selectedEntryIndex: -1,
            editor: ClassicEditor,
            editorConfig: {},
            entriesFilter: "",
        };
    },
    computed: {
        dictionaryEntries(): Array<DictionaryEntry> {
            return this.store.dictionary.entries;
        },
        selectedEntry(): DictionaryEntry|undefined {
            return this.dictionaryEntries[this.selectedEntryIndex];
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
        selectEntry(index: number) {
            this.selectedEntryIndex = index;
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
        deleteEntryAt(index: number) {
            this.store.do("removeDictionaryEntryAt", index);
        },
        uploadCSV(e: InputEvent) {
            const target = e.target as HTMLInputElement;
            const file = (target.files ?? [])[0];
            const fileReader = new FileReader();
            fileReader.onload = () => {
                if (typeof fileReader.result === "string") {
                    const csv = parseCSV(fileReader.result);
                    for (const [id, [CN,EN,defCN,defEN,FR,defFR,url]] of csv.entries()) {
                        if (id > 0) {
                            this.store.do("addDictionaryEntry", { id: id.toString(), name: {CN, EN, FR}, defCN, defEN, defFR, url });
                        }
                    }
                }
            };
            fileReader.readAsText(file);
        }
    }
});
</script>