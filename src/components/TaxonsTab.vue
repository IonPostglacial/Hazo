<template>
    <div class="horizontal-flexbox start-align flex-grow-1 no-vertical-overflow">
        <resizable-panel v-if="showLeftMenu" class="scroll white-background no-print">
            <tree-menu :editable="true" :items="dataset.taxonsHierarchy" :selected-item="selectedTaxon ? selectedTaxon.id : ''" 
                :name-fields="[{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }]"
                @add-item="addTaxon" @unselected="selectedTaxonId = undefined" @delete-item="removeTaxon" v-slot="menuProps">
                <router-link class="flex-grow-1 nowrap unstyled-anchor" :to="'/taxons/' + menuProps.item.id">{{ menuProps.item.name }}</router-link>
            </tree-menu>
        </resizable-panel>
        <popup-galery :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></popup-galery>
        <extra-fields-panel :showFields="showFields" :extraFields="dataset.extraFields" @closed="showFields = false"></extra-fields-panel>
        <div class="vertical-flexbox flex-grow-1">
            <div class="horizontal-flexbox space-between no-print medium-padding thin-border">
                <div class="horizontal-flexbox">
                    <div class="button-group">
                        <button type="button" @click="showLeftMenu = !showLeftMenu">Left Menu</button>
                        <button type="button" @click="showMap = !showMap">Map</button>
                    </div>
                    <span class="medium-margin">Edit:</span>
                    <div class="button-group">
                        <button type="button" :class="{ 'selected-tab': editProperties }" @click="switchEditMode">Properties</button>
                        <button type="button" :class="{ 'selected-tab': editDescriptors }" @click="switchEditMode">Descriptors</button>
                    </div>
                    <button type="button" @click="printPresentation">Print</button>
                </div>
                <div v-if="selectedTaxon" class="relative">
                    <div v-if="selectingParent">
                        <button type="button" @click="closeSelectParentDropdown" class="background-color-1">select parent</button>
                        <div class="absolute white-background thin-border big-max-height medium-padding scroll" style="top:32px;">
                            <tree-menu :items="dataset.taxonsHierarchy"
                                :name-fields="[{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }]"
                                @select-item="changeSelectedTaxonParent">
                            </tree-menu>
                        </div>
                    </div>
                    <div v-if="!selectingParent" class="button-group">
                        <button type="button" v-for="parent in dataset.taxonsHierarchy.parentsOf(selectedTaxon)" :key="parent.id" @click="selectTaxon(parent.id)">{{ parent.name.S }}</button>
                        <button type="button" @click="openSelectParentDropdown" class="background-color-1">{{ selectedTaxon.name.S }}</button>
                    </div>
                </div>
                <div class="button-group">
                    <button v-if="(typeof selectedTaxon !== 'undefined')" type="button" @click="copyItem">Copy</button>
                    <button type="button" @click="pasteItem">Paste</button>
                </div>
                <div class="button-group">
                    <label class="button" for="importKml">KML</label>
                    <button type="button" @click="emptyZip">Folders</button>
                    <button type="button" @click="texExport">Latex{{latexProgressText}}</button>
                    <button type="button" @click="exportStats">Stats</button>
                    <button type="button" @click="showFields = !showFields">Extra Fields</button>
                </div>
                <input class="invisible" type="file" name="importKml" id="importKml" @change="importKml">
            </div>
            <google-map v-if="(typeof selectedTaxon !== 'undefined')"
                    :class="{ invisible: !showMap }"
                    id="mapid"
                    ref="Map"
                    :center="{ lat: 48.856614, lng: 2.3522219 }"
                    :zoom="12">
                <google-map-marker v-for="(position, index) in selectedTaxon.specimenLocations"
                    :key="index"
                    :title="selectedTaxon.name"
                    :position="position"
                />
            </google-map>
                <div ref="printtemplate" class="invisible">
                    <taxon-presentation
                        @taxon-selected="selectTaxon" :show-left-menu="showLeftMenu"
                        :selected-taxon-id="selectedTaxonId" :dataset="dataset">
                    </taxon-presentation>
                </div>

            <section v-if="selectedTaxon" class="flex-grow-1 horizontal-flexbox scroll">
                <div :class="['vertical-flexbox', 'scroll', { 'flex-grow-1': !editDescriptors }]">
                    <picture-box :editable="editProperties"
                        @open-photo="openPhoto"
                        @add-photo="addItemPhoto"
                        @set-photo="setItemPhoto"
                        @delete-photo="deleteItemPhoto"
                        :pictures="selectedTaxon.pictures">
                    </picture-box>
                    <collapsible-panel v-if="editProperties" label="Properties">
                        <div class="scroll large-max-width form-grid medium-padding">
                            <div v-if="editProperties" class="display-contents">
                                <label>NS</label>
                                <input class="italic" type="text" lang="lat" spellcheck="false" v-model="selectedTaxon.name.S" />
                                <label>Author</label>
                                <input type="text" v-model="selectedTaxon.author" />
                            </div>
                            <item-property-field v-model="selectedTaxon.name2" :editable="editProperties">
                                Synonymous</item-property-field>
                            <item-property-field v-model="selectedTaxon.name.CN" :editable="editProperties">
                                中文名</item-property-field>
                            <item-property-field v-model="selectedTaxon.name.V" :editable="editProperties">
                                NV</item-property-field>
                            <item-property-field v-model="selectedTaxon.vernacularName2" :editable="editProperties">
                                NV 2</item-property-field>

                            <label>Website</label>
                            <input v-if="editProperties" type="text" v-model="selectedTaxon.website" />
                            <a v-if="!editProperties" target="_blank" :href="selectedTaxon.website">{{ selectedTaxon.website }}</a>

                            <label>Meaning</label>
                            <textarea :readonly="!editProperties" v-model="selectedTaxon.meaning"></textarea>

                            <item-property-field v-model="selectedTaxon.noHerbier" :editable="editProperties">
                                N° Herbier</item-property-field>
                            <item-property-field v-model="selectedTaxon.herbariumPicture" :editable="editProperties">
                                Herbarium Picture</item-property-field>
                            <item-property-field v-for="extraField in dataset.extraFields" :key="extraField.id"
                                    :icon="extraField.icon" v-model="selectedTaxon.extra[extraField.id]" :editable="editProperties">
                                {{ extraField.label }}
                            </item-property-field>
                        </div>
                    </collapsible-panel>
                    <collapsible-panel v-if="!editProperties" label="Description">
                        <div class="inline-block medium-padding medium-margin"><i>{{ selectedTaxon.name.S }}</i> {{ selectedTaxon.author }}</div>
                        <ul>
                            <li v-for="desc in itemDescription" :key="desc.character.id">
                                {{ desc.character.name.S }}
                                <ul v-if="desc.states.length > 0" class="indented">
                                    <li v-for="state in desc.states" :key="state.id">
                                        {{ state.name.S }}<a class="button" href="#1" @click="pushStateToChildren(state)">Push to children</a>
                                    </li>
                                </ul>
                            </li>
                        </ul>
                    </collapsible-panel>
                    <collapsible-panel v-for="book in dataset.books" :key="book.id" :label="book.label">
                        <div v-if="selectedTaxon.bookInfoByIds">
                            <div v-if="selectedTaxon.bookInfoByIds[book.id]">
                                <label class="medium-margin">
                                    book:&nbsp;
                                    <input v-if="editProperties" type="text" v-model="selectedTaxon.bookInfoByIds[book.id].fasc" />
                                    <div class="inline-block medium-padding medium-margin" v-if="!editProperties">
                                        {{ selectedTaxon.bookInfoByIds[book.id].fasc }}
                                    </div>
                                </label>
                                <label class="medium-margin">
                                    page:&nbsp;
                                    <input v-if="editProperties" type="text" v-model="selectedTaxon.bookInfoByIds[book.id].page" />
                                    <div class="inline-block medium-padding medium-margin" v-if="!editProperties">
                                        {{ selectedTaxon.bookInfoByIds[book.id].page }}
                                    </div>
                                </label>
                                <ckeditor v-if="editProperties" :editor="editor" v-model="selectedTaxon.bookInfoByIds[book.id].detail" :config="editorConfig"></ckeditor>
                                <div v-if="!editProperties" class="limited-width medium-padding" v-html="selectedTaxon.bookInfoByIds[book.id].detail"></div><br/>
                            </div>
                        </div>
                    </collapsible-panel>
                    <collapsible-panel label="Additional Text" id="item-detail">
                        <ckeditor v-if="editProperties" :editor="editor" v-model="selectedTaxon.detail" :config="editorConfig"></ckeditor>
                        <div v-if="!editProperties" class="limited-width" v-html="selectedTaxon.detail"></div>
                    </collapsible-panel>
                </div>
                <div v-if="editDescriptors" class="vertical-flexbox scroll flex-grow-1">
                    <collapsible-panel label="Description">
                        <SquareTreeViewer class="large-max-width" :name-fields="['S', 'EN', 'CN']" :editable="editDescriptors" :rootItems="itemDescriptorTree" @item-selection-toggled="taxonStateToggle" @item-open="openCharacter"></SquareTreeViewer>
                    </collapsible-panel>
                </div>
            </section>
        </div>
    </div>
</template>

<script lang="ts">
import SquareTreeViewer from "./SquareTreeViewer.vue";
import TreeMenu from "./TreeMenu.vue";
import PopupGalery from "./PopupGalery.vue";
import TaxonPresentation from "./TaxonPresentation.vue";
import ExtraFieldsPanel from "./ExtraFieldsPanel.vue";
import PictureBox from "./PictureBox.vue";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Book, Character, Dataset, Description, Hierarchy, State, Taxon } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Vue from "vue";
import CollapsiblePanel from "./CollapsiblePanel.vue";
import ResizablePanel from "./ResizablePanel.vue";
import ItemPropertyField from "./ItemPropertyField.vue";
import download from "@/tools/download";
import exportStatistics from "@/features/exportstats";
import { TexExporter, exportZipFolder, importKml } from "@/features";
import { createTaxon } from "@/datatypes/Taxon";
import { createHierarchicalItem } from "@/datatypes/HierarchicalItem";


export default Vue.extend({
    name: "TaxonsTab",
    components: {
        CollapsiblePanel, ItemPropertyField, PictureBox, SquareTreeViewer, ckeditor: CKEditor.component,
        ExtraFieldsPanel, PopupGalery, ResizablePanel, TreeMenu, TaxonPresentation
    },
    data() {
        return {
            store: Hazo.store,
            showLeftMenu: true,
            showFields: false,
            showBigImage: false,
            showMap: false,
            bigImages: [{ id: "", url: "", label: "" }],
            editProperties: true,
            editDescriptors: false,
            editor: ClassicEditor,
            editorConfig: {},
            latexProgressText: "",
            selectingParent: false,
            selectedTaxonId: this.$route.params.id ?? "",
        }
    },
    watch: {
        $route(to: any) {
            this.selectedTaxonId = to.params.id;
        },
    },
    computed: {
        dataset(): Dataset {
            return this.store.dataset;
        },
        selectedTaxon(): Taxon|undefined {
            return this.dataset.taxonsHierarchy.itemWithId(this.selectedTaxonId);
        },
        itemDescriptorTree(): Hierarchy<Character & { selected?: boolean }> {
            if (typeof this.selectedTaxon !== "undefined") {
                return this.dataset.taxonCharactersTree(this.selectedTaxon);
            } else {
                return new Hierarchy("", new Map());
            }
        },
        itemDescription(): Iterable<Description> {
            if (typeof this.selectedTaxon === "undefined") {
                return [];
            } else {
                return this.dataset.taxonDescriptions(this.selectedTaxon);
            }
        }
    },
    methods: {
        printPresentation() {
            const divContents = (this.$refs.printtemplate as HTMLElement).innerHTML;
            if (!divContents) return;
            const a = window.open('', '', 'height=800, width=600');
            if (!a) return;
            a.document.write('<html>');
            a.document.write('<head><link rel="stylesheet" href="/Hazo/style.css"></head>');
            a.document.write('<body>');
            a.document.write(divContents);
            a.document.write('</body></html>');
            a.document.close();
            a.addEventListener("load", () => a.print());
        },
        pushStateToChildren(state: State) {
            for (const child of this.dataset.taxonsHierarchy.getOrderedChildrenTree(this.selectedTaxon)) {
                this.dataset.statesByTaxons.add(child.id, state.id);
            }
        },
        switchEditMode() {
            this.editProperties = !this.editProperties;
            this.editDescriptors = !this.editDescriptors;
        },
        async importKml(e: InputEvent) {
            if (!(e.target instanceof HTMLInputElement) || !this.selectedTaxon) return;
            
            const positions = await importKml((e.target.files ?? [])[0]);

            this.store.do("setTaxonLocations", { taxon: this.selectedTaxon, positions });
        },
        copyItem() {
            if (this.selectedTaxon) {
                this.store.do("copyTaxon", this.selectedTaxon);
            }
        },
        pasteItem() {
            this.store.do("pasteTaxon", this.selectedTaxonId);
        },
        openSelectParentDropdown() {
            this.selectingParent = true;
        },
        closeSelectParentDropdown() {
            this.selectingParent = false;
        },
        changeSelectedTaxonParent(id: string) {
            if (this.selectedTaxon) {
                this.store.do("changeTaxonParent", { taxon: this.selectedTaxon, newParentId: id });
            }
            this.selectingParent = false;
        },
        selectTaxon(id: string) {
            this.selectedTaxonId = id;
        },
        addTaxon(e: {value: string[], parentId: string }) {
            const [name, vernacularName, nameCN] = e.value;
            this.store.do("addTaxon", createTaxon({
                ...createHierarchicalItem({ id: "", type: "", name: { S: name, V: vernacularName, CN: nameCN}, pictures: [], }),
                bookInfoByIds: Object.fromEntries(this.dataset.books!.map((book: Book) => [book.id, { fasc: "", page: undefined, detail: "" }])),
                parentId: e.parentId
            }));
        },
        removeTaxon(e: { itemId: string }) {
            const taxonToRemove = this.dataset.taxonsHierarchy?.itemWithId(e.itemId);
            if (taxonToRemove) {
                this.store.do("removeTaxon", taxonToRemove);
            }
        },
        setProperty(e: { detail: { property: string, value: string } }) {
            (this.selectedTaxon as any)[e.detail.property] = e.detail.value;
        },
        setExtraProperty(e: { detail: { property: string, value: string } }) {
            this.selectedTaxon!.extra[e.detail.property] = e.detail.value;
        },
        taxonStateToggle(e: { item: State|Character }) {
            const isCharacter = (e.item as Character).type === "character";
            const stateToAdd = isCharacter ? (e.item as Character).inherentState : e.item as State;

            if (typeof this.selectedTaxon !== "undefined" && typeof stateToAdd !== "undefined") {
                const selected = !this.dataset.hasTaxonState(this.selectedTaxon, stateToAdd);
                this.store.do("setTaxonState", { taxon: this.selectedTaxon, state: stateToAdd, has: selected });
            }
        },
        openCharacter(e: { item: Character }) {
            if (e.item.inherentState && this.selectedTaxon && !this.dataset.hasTaxonState(this.selectedTaxon, e.item.inherentState)) {
                this.taxonStateToggle({ item: e.item.inherentState });
            }
        },
        addItemPhoto(e: {detail: { value: string }}) {
            if (typeof this.selectedTaxon === "undefined") {
                console.warn("Trying to add a photo but no taxon selected.");
                return;
            }
            const numberOfPhotos = this.selectedTaxon.pictures.length;
            this.store.do("addTaxonPicture", { taxon: this.selectedTaxon, picture: { id: `${this.selectedTaxon.id}-${numberOfPhotos}`, url: e.detail.value, label: e.detail.value } });
        },
        setItemPhoto(e: {detail: {index: number, value: string}}) {
            if (!this.selectedTaxon) { return; }

            this.store.do("setTaxonPicture", {
                taxon: this.selectedTaxon,
                index: e.detail.index,
                picture: { ...this.selectedTaxon!.pictures[e.detail.index], url: e.detail.value },
            });
        },
        deleteItemPhoto(e: {detail: { index: number }}) {
            if (!this.selectedTaxon) { return; }

            this.store.do("removeTaxonPicture", { taxon: this.selectedTaxon, index: e.detail.index });
        },
        openPhoto(e: Event & {detail: { index: number }}) {
            this.bigImages = this.selectedTaxon!.pictures;
            this.showBigImage = true;
        },
        async emptyZip() {
            const zipTxt = await exportZipFolder(this.dataset.taxonsHierarchy!);
            download(zipTxt, "zip", undefined, true);
        },
        texExport() {
            const taxonToTex = new TexExporter(this.dataset);
            taxonToTex.onProgress((current, max) =>  { this.latexProgressText = " [" + current + " / " + max + "]" });
            taxonToTex.export().then(tex => {
                download(tex, "zip", undefined, true);
            });
        },
        exportStats() {
            const csv = exportStatistics(this.dataset.taxonsHierarchy);
            download(csv, "csv");
        },
    }
});
</script>