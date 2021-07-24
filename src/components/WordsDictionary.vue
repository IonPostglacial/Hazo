<template>
    <div>
        <div class="horizontal-flexbox height-full">
            <div class="scroll height-full">
                <div class="white-background stick-to-top horizontal-flexbox">
                    <input type="file" class="invisible" name="csvFileChooser" id="csvFileChooser" v-on:change="uploadCSV">
                    <input type="search" v-model="entriesFilter" class="flex-grow-1" name="searchEntries" id="searchEntries" placeholder="Filter">
                    <div class="button-group">
                        <button type="button" v-on:click="importCSV">Import CSV</button>
                        <button type="button" v-on:click="exportCSV">Export CSV</button>
                    </div>
                </div>
                <table class="white-background medium-padding">
                    <tr class="stick-to-top white-background"><th></th><th>名词</th><th>Name</th><th>Nom</th></tr>
                    <tr v-for="entry in entriesToDisplay" :key="entry.id" class="blue-hover relative">
                        <td><input type="radio" name="selectedEntry" v-model="selectedEntryId" :id="'selectedEntry-' + entry.id" :value="entry.id"></td>
                        <td><label :for="'selectedEntry-' + entry.id" class="full-width">{{ entry.nameCN }}</label></td>
                        <td><label :for="'selectedEntry-' + entry.id" class="full-width">{{ entry.nameEN }}</label></td>
                        <td><label :for="'selectedEntry-' + entry.id" class="full-width">{{ entry.nameFR }}</label></td>
                    </tr>
                </table>
                <add-item @add-item="addEntry"></add-item>
            </div>
            <div v-if="(typeof selectedEntry !== 'undefined')" class="white-background medium-padding scroll height-full">
                <div class="horizontal-flexbox">
                    <div>
                        <label class="item-property">名词</label>
                        <input type="text" spellcheck="false" v-model="selectedEntry.nameCN" /><br/>
                        <label class="item-property">Name</label>
                        <input type="text" spellcheck="false" v-model="selectedEntry.nameEN" /><br/>
                        <label class="item-property">Nom</label>
                        <input type="text" spellcheck="false" v-model="selectedEntry.nameFR" /><br/>
                        <label class="item-property">Illustration</label>
                        <input type="text" spellcheck="false" v-model="selectedEntry.url" /><br/>
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
</template>

<script lang="ts">
import parseCSV from "@/tools/parse-csv";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
import AddItem from "./AddItem.vue";
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { defineComponent } from "vue";  // eslint-disable-line no-unused-vars
import download from "@/tools/download";
import { DictionaryEntry, IMap } from "@/datatypes";  // eslint-disable-line no-unused-vars
import { filter } from "@/tools/iter";

export default defineComponent({
    name: "WordsDictionary",
    components: {
        ckeditor: CKEditor.component,
        AddItem,
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
            if (this.entriesFilter !== "") {
                return filter(this.dictionaryEntries.values(), (entry) => {
                    return ["nameCN", "nameEN", "nameFR"].
                        map(field => (entry as any)[field]).
                        some(name => name?.toUpperCase().startsWith(this.entriesFilter?.toUpperCase()) ?? false);
                });
            } else {
                return this.dictionaryEntries.values();
            }
        },
    },
    methods: {
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
            for (const { nameCN, nameEN, defCN, defEN, nameFR, defFR, url } of this.dictionaryEntries.values()) {
                csv += [nameCN, nameEN, defCN, defEN, nameFR, defFR, url].map(escapeValue).join(",") + "\n";
            }
            download(csv, "csv");
        },
        addEntry(e: { detail: string[] }) {
            const [nameCN, nameEN, defCN, defEN, nameFR, defFR] = e.detail;
            const id = Date.now();
            this.store.do("addDictionaryEntry", {
                id: id.toString(), nameCN: nameCN ?? "", nameEN: nameEN ?? "", defCN: defCN ?? "",
                defEN: defEN ?? "", nameFR: nameFR ?? "", defFR: defFR ?? "", url: ""
            });
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
                            this.dictionaryEntries.set(""+id, { id: id.toString(), nameCN, nameEN, defCN, defEN, nameFR: "", defFR: "", url: "" });
                        }
                    }
                }
            };
            fileReader.readAsText(file);
        }
    }
});
</script>

<style>

</style>