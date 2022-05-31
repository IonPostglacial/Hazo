<template>
    <div>
        <div class="horizontal-flexbox scroll flex-grow-1">
            <popup-galery :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></popup-galery>
            <extra-fields-panel :showFields="showFields" :extraFields="dataset.extraFields" @closed="showFields = false"></extra-fields-panel>
            <div class="vertical-flexbox flex-grow-1">
                <v-toolbar-items dense class="no-print">
                    <v-btn icon v-if="(typeof selectedTaxon !== 'undefined')" title="copy taxon" type="button" @click="copyItem"><v-icon>mdi-content-copy</v-icon></v-btn>
                    <v-btn icon @click="pasteItem" title="paste taxon"><v-icon>mdi-content-paste</v-icon></v-btn>
                    <v-btn icon @click="showMap = !showMap" title="show on the map"><v-icon>mdi-map</v-icon></v-btn>
                    <v-btn @click="sortTaxons">Sort</v-btn>
                    <v-btn icon :to="'/print-taxons/' + this.selectedTaxonId" title="print the taxon and its descendants">
                        <v-icon>mdi-printer</v-icon>
                    </v-btn>
                    <v-spacer></v-spacer>
                    <div v-if="selectedTaxon" class="relative">
                        <div v-if="selectingParent">
                            <v-btn @click="closeSelectParentDropdown" class="background-color-1">select parent</v-btn>
                            <div class="absolute white-background thin-border big-max-height medium-padding scroll" style="top:32px;">
                                <tree-menu :items="taxonTree"
                                    :name-fields="nameFields"
                                    @select-item="changeSelectedTaxonParent" v-slot="menuProps">
                                    <div>{{ menuProps.item.name }}</div>
                                </tree-menu>
                            </div>
                        </div>
                        <div v-if="!selectingParent">
                            <div class="display-contents" v-for="(parent, i) in dataset.taxonParentChain(selectedTaxon.id)" :key="parent.id">
                                <v-icon v-if="i > 0">mdi-chevron-right</v-icon>
                                <v-btn plain class="pa-1" @click="selectTaxon(parent.id)">
                                    {{ parent.name.S }}
                                </v-btn>
                            </div>
                            <v-btn @click="openSelectParentDropdown" class="background-color-1">{{ selectedTaxon.name.S }}</v-btn>
                        </div>
                    </div>
                    <v-spacer></v-spacer>

                    <label class="v-btn theme--light v-size--default" for="importKml">KML</label>
                    <v-btn text @click="emptyZip">Folders</v-btn>
                    <v-btn text @click="texExport">Latex{{latexProgressText}}</v-btn>
                    <v-btn text to="/taxons-stats">Stats</v-btn>
                    <v-btn text @click="showFields = !showFields">Extra Fields</v-btn>
                    <input class="invisible" type="file" name="importKml" id="importKml" @change="importKml">
                </v-toolbar-items>
                <google-map v-if="selectedTaxon && showMap"
                        id="mapid"
                        ref="Map"
                        :center="{ lat: 48.856614, lng: 2.3522219 }"
                        :zoom="12">
                    <google-map-marker v-for="(position, index) in specimenLocations"
                        :key="index"
                        :title="selectedTaxon ? selectedTaxon.name : ''"
                        :position="position"
                    />
                </google-map>
                <v-row>
                    <v-col cols="8">
                        <v-expansion-panels accordion multiple v-model="panels">
                            <v-expansion-panel>
                                <v-expansion-panel-header>
                                    Pictures
                                </v-expansion-panel-header>
                                <v-expansion-panel-content>
                                    <picture-box :editable="editProperties"
                                        @open-photo="openPhoto"
                                        @add-photo="addItemPhoto"
                                        @set-photo="setItemPhoto"
                                        @delete-photo="deleteItemPhoto"
                                        :pictures="selectedTaxon.pictures">
                                    </picture-box>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                            <v-expansion-panel>
                                <v-expansion-panel-header>
                                    Properties
                                </v-expansion-panel-header>
                                <v-expansion-panel-content>
                                    <div class="scroll large-max-width form-grid">
                                        <div v-if="editProperties" class="display-contents">
                                            <label>NS</label>
                                            <v-text-field dense class="italic" type="text" lang="lat" spellcheck="false" v-model="selectedTaxon.name.S"></v-text-field>
                                            <label>Author</label>
                                            <v-text-field dense v-model="selectedTaxon.author"></v-text-field>
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
                                        <v-text-field v-if="editProperties" type="text" v-model="selectedTaxon.website"></v-text-field>
                                        <a v-if="!editProperties" target="_blank" :href="selectedTaxon.website">{{ selectedTaxon.website }}</a>

                                        <label>Meaning</label>
                                        <v-textarea dense outlined :readonly="!editProperties" v-model="selectedTaxon.meaning"></v-textarea>

                                        <item-property-field v-model="selectedTaxon.noHerbier" :editable="editProperties">
                                            N° Herbier</item-property-field>
                                        <item-property-field v-model="selectedTaxon.herbariumPicture" :editable="editProperties">
                                            Herbarium Picture</item-property-field>
                                        <item-property-field v-for="extraField in dataset.extraFields" :key="extraField.id"
                                                :icon="extraField.icon"
                                                :value="extraProperty(extraField)"
                                                @input="setExtraProperty"
                                                :editable="editProperties">
                                            {{ extraField.label }}
                                        </item-property-field>
                                    </div>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                            <v-expansion-panel>
                                <v-expansion-panel-header>
                                    Description
                                </v-expansion-panel-header>
                                <v-expansion-panel-content>
                                    <SquareTreeViewer :name-fields="['S', 'EN', 'CN']" :editable="editDescriptors" :rootItems="itemDescriptorTree" @item-selection-toggled="taxonStateToggle" @item-open="openCharacter"></SquareTreeViewer>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                            <v-expansion-panel v-for="book in dataset.books" :key="book.id">
                                <v-expansion-panel-header>
                                    {{ book.label }}
                                </v-expansion-panel-header>
                                <v-expansion-panel-content v-if="selectedTaxon && selectedTaxon.bookInfoByIds">
                                    <div v-if="selectedTaxon.bookInfoByIds[book.id]">
                                        <v-toolbar dense flat>
                                            <label>page</label>
                                            <v-text-field dense class="mt-4 ml-4" v-if="editProperties" v-model="selectedTaxon.bookInfoByIds[book.id].page"></v-text-field>
                                            <div class="inline-block medium-padding medium-margin" v-if="!editProperties">
                                                {{ selectedTaxon.bookInfoByIds[book.id].page }}
                                            </div>
                                            <label>book</label>
                                            <v-text-field dense class="mt-4 ml-4" v-if="editProperties" v-model="selectedTaxon.bookInfoByIds[book.id].fasc"></v-text-field>
                                            <div class="inline-block medium-padding medium-margin" v-if="!editProperties">
                                                {{ selectedTaxon.bookInfoByIds[book.id].fasc }}
                                            </div>
                                        </v-toolbar>
                                        <ckeditor v-if="editProperties" :editor="editor" v-model="selectedTaxon.bookInfoByIds[book.id].detail" :config="editorConfig"></ckeditor>
                                        <div v-if="!editProperties" class="limited-width medium-padding" v-html="selectedTaxon.bookInfoByIds[book.id].detail"></div><br/>
                                    </div>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                            <v-expansion-panel id="item-detail">
                                <v-expansion-panel-header>
                                    Additional Text
                                </v-expansion-panel-header>
                                <v-expansion-panel-content>
                                    <ckeditor v-if="editProperties" :editor="editor" v-model="selectedTaxon.detail" :config="editorConfig"></ckeditor>
                                    <div v-if="!editProperties" class="limited-width" v-html="selectedTaxon.detail"></div>
                                </v-expansion-panel-content>
                            </v-expansion-panel>
                        </v-expansion-panels>
                    </v-col>
                    <v-col cols="4">
                        <p>
                            <a :href="selectedTaxon.website" target="_blank">{{ selectedTaxon.website }}</a>
                        </p>
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
                    </v-col>
                </v-row>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import SquareTreeViewer from "./SquareTreeViewer.vue";
import PopupGalery from "./PopupGalery.vue";
import TaxonPresentation from "./TaxonPresentation.vue";
import ExtraFieldsPanel from "./ExtraFieldsPanel.vue";
import SplitPanel from "./SplitPanel.vue";
import PictureBox from "./PictureBox.vue";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Book, Character, Dataset, Description, Hierarchy, State, Taxon } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Vue from "vue";
import CollapsiblePanel from "./CollapsiblePanel.vue";
import ItemPropertyField from "./ItemPropertyField.vue";
import download from "@/tools/download";
import { createTexExporter, exportZipFolder, importKml } from "@/features";
import { taxonHasStates } from "@/datatypes/Taxon";
import { taxonOrAnyChildHasStates } from "@/datatypes/Taxon";
import { normalizePicture } from "@/datatypes/picture";
import { forEachHierarchy, sortHierarchy, transformHierarchy } from "@/datatypes/hierarchy";
import { createCharacter } from "@/datatypes/Character";
import { DiscreteCharacter, Field, SelectableItem } from "@/datatypes/types";


export default Vue.extend({
    name: "TaxonsTab",
    components: {
        CollapsiblePanel, ItemPropertyField, PictureBox, SquareTreeViewer, ckeditor: CKEditor.component,
        ExtraFieldsPanel, PopupGalery, SplitPanel, TaxonPresentation
    },
    data() {
        return {
            nameFields: [{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }],
            store: Hazo.store,
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
            panels: [0, 1],
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
        taxonTree(): Taxon {
            if (this.store.statesAllowList.length > 0 || this.store.statesDenyList.length > 0) {
                return transformHierarchy(this.dataset.taxonsHierarchy, {
                    map: t => t,
                    filter: t => taxonOrAnyChildHasStates(t, this.store.statesAllowList) && 
                        (this.store.statesDenyList.length == 0 || !taxonHasStates(t, this.store.statesDenyList)),
                });
            } else {
                return this.dataset.taxonsHierarchy;
            }
        },
        selectedTaxon(): Taxon|undefined {
            return this.dataset.taxon(this.selectedTaxonId);
        },
        specimenLocations(): { lat: number, lng: number }[] {
            return this.selectedTaxon?.specimenLocations ?? [];
        },
        itemDescriptorTree(): Hierarchy<SelectableItem> {
            if (typeof this.selectedTaxon !== "undefined") {
                return this.dataset.taxonCharactersTree(this.selectedTaxon);
            } else {
                return createCharacter({ id: "c0", name: { S: '' }});
            }
        },
        itemDescription(): Description[] {
            if (typeof this.selectedTaxon === "undefined") {
                return [];
            } else {
                return this.dataset.taxonDescriptions(this.selectedTaxon);
            }
        },
    },
    methods: {
        pushStateToChildren(state: State) {
            if (typeof this.selectedTaxon === "undefined") return;
            forEachHierarchy(this.selectedTaxon, child => {
                this.dataset.setTaxonState(child.id, state);
            });
        },
        sortTaxons() {
            sortHierarchy(this.taxonTree, (t1, t2) => t1.name.S.localeCompare(t2.name.S));
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
        setProperty(e: { detail: { property: string, value: string } }) {
            (this.selectedTaxon as any)[e.detail.property] = e.detail.value;
        },
        setExtraProperty(e: { detail: { property: string, value: string } }) {
            this.selectedTaxon!.extra[e.detail.property] = e.detail.value;
        },
        taxonStateToggle(e: { item: State|Character }) {
            const ch = e.item as Character;
            const isDiscreteCharacter = ch.type === "character" && ch.characterType === "discrete";
            const stateToAdd = isDiscreteCharacter ? (ch as DiscreteCharacter).inherentState : e.item as State;

            if (typeof this.selectedTaxon !== "undefined" && typeof stateToAdd !== "undefined") {
                const selected = !this.dataset.hasTaxonState(this.selectedTaxonId, stateToAdd);
                this.store.do("setTaxonState", { taxon: this.selectedTaxon, state: stateToAdd, has: selected });
            }
        },
        openCharacter(e: { item: DiscreteCharacter }) {
            if (e.item.inherentState && this.selectedTaxon && !this.dataset.hasTaxonState(this.selectedTaxonId, e.item.inherentState)) {
                this.taxonStateToggle({ item: e.item.inherentState });
            }
        },
        extraProperty(extraField: Field): any {
            return this.selectedTaxon!.extra[extraField.id];
        },
        addItemPhoto(e: {detail: { value: string }}) {
            if (typeof this.selectedTaxon === "undefined") {
                console.warn("Trying to add a photo but no taxon selected.");
                return;
            }
            const numberOfPhotos = this.selectedTaxon.pictures.length;
            this.store.do("addTaxonPicture", { taxon: this.selectedTaxon, picture: normalizePicture({ id: `${this.selectedTaxon.id}-${numberOfPhotos}`, url: e.detail.value, label: e.detail.value, hubUrl: undefined }) });
        },
        setItemPhoto(e: {detail: {index: number, src: string, hubUrl: string}}) {
            if (!this.selectedTaxon) { return; }

            this.store.do("setTaxonPicture", {
                taxon: this.selectedTaxon,
                index: e.detail.index,
                picture: normalizePicture({ ...this.selectedTaxon!.pictures[e.detail.index], url: e.detail.src, hubUrl: e.detail.hubUrl }),
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
            const zipTxt = await exportZipFolder(this.selectedTaxon ?? this.dataset.taxonsHierarchy!);
            download(zipTxt, "zip", undefined, true);
        },
        texExport() {
            const taxonToTex = createTexExporter(this.dataset);
            taxonToTex.onProgress((current, max) =>  { this.latexProgressText = " [" + current + " / " + max + "]" });
            taxonToTex.export().then(tex => {
                download(tex, "zip", undefined, true);
            });
        },
    }
});
</script>