<template>
    <split-panel class="horizontal-flexbox start-align flex-grow-1 no-vertical-overflow">
        <tree-menu v-if="selectedColumns.includes('menu')" class="scroll white-background no-print" :editable="true" :items="taxonTree" :selected-item="selectedTaxon ? selectedTaxon.id : ''" 
            :autocomplete="true"
            :name-fields="nameFields"
            @move-item-up="moveUp" @move-item-down="moveDown"
            @add-item="addTaxon" @unselected="selectedTaxonId = ''" @delete-item="removeTaxon" v-slot="menuProps">
            <router-link class="flex-grow-1 nowrap unstyled-anchor" :to="'/taxons/' + menuProps.item.id">{{ menuProps.item.name }}</router-link>
        </tree-menu>
        <HBox class="scroll flex-grow-1">
            <popup-galery :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></popup-galery>
            <extra-fields-panel :showFields="showFields" :extraFields="dataset.extraFields" @closed="showFields = false"></extra-fields-panel>
            <VBox class="flex-grow-1">
                <HBox class="no-print medium-padding thin-border">
                    <HBox>
                        <router-link class="button" :to="'/print-taxons/' + selectedTaxonId" title="print">
                            <font-awesome-icon icon="fa-solid fa-print" />
                        </router-link>
                    </HBox>
                    <div class="button-group">
                        <button title="copy" v-if="(typeof selectedTaxon !== 'undefined')" type="button" @click="copyItem">
                            <font-awesome-icon icon="fa-solid fa-copy" />
                        </button>
                        <button title="paste" type="button" @click="pasteItem">
                            <font-awesome-icon icon="fa-solid fa-paste" />
                        </button>
                    </div>
                    <div v-if="selectedTaxon" class="relative">
                        <div v-if="selectingParent">
                            <button type="button" @click="closeSelectParentDropdown" class="background-color-1">select parent</button>
                            <div class="absolute white-background thin-border big-max-height medium-padding scroll" style="top:32px;">
                                <tree-menu :items="taxonTree"
                                    :name-fields="nameFields"
                                    @select-item="changeSelectedTaxonParent" v-slot="menuProps">
                                    <div>{{ menuProps.item.name }}</div>
                                </tree-menu>
                            </div>
                        </div>
                        <div v-if="!selectingParent" class="button-group">
                            <button type="button" v-for="parent in taxonParentChain(dataset, selectedTaxon.id)" :key="parent.id" @click="selectTaxon(parent.id)">{{ parent.name.S }}</button>
                            <button type="button" @click="openSelectParentDropdown" class="background-color-1">{{ selectedTaxon.name.S }}</button>
                        </div>
                    </div>
                    <Spacer></Spacer>
                    <div class="button-group">
                        <drop-down label="Columns">
                            <VBox>
                                <column-selector name="Left Menu" 
                                    value="menu" :magnifyable="false"
                                    :selected="selectedColumns.includes('menu')"
                                    @zoom-column="zoomColumn" @add-column="addColumn"
                                    @remove-column="removeColumn"  />
                                <column-selector name="Properties" 
                                    value="props" :magnifyable="true"
                                    :selected="selectedColumns.includes('props')"
                                    @zoom-column="zoomColumn" @add-column="addColumn"
                                    @remove-column="removeColumn" />
                                <column-selector name="Descriptors" 
                                    value="desc" :magnifyable="true"
                                    :selected="selectedColumns.includes('desc')"
                                    @zoom-column="zoomColumn" @add-column="addColumn"
                                    @remove-column="removeColumn"  />
                                <column-selector name="Summary" 
                                    value="summary" :magnifyable="true"
                                    :selected="selectedColumns.includes('summary')"
                                    @zoom-column="zoomColumn" @add-column="addColumn"
                                    @remove-column="removeColumn"  />
                            </VBox>
                        </drop-down>
                        <drop-down label="Export">
                            <VBox>
                                <label class="button" for="importKml">KML</label>
                                <button type="button" @click="emptyZip">Folders</button>
                                <button type="button" @click="texExport">Latex{{latexProgressText}}</button>
                                <router-link class="button" to="/taxons-stats">Stats</router-link>
                            </VBox>
                        </drop-down>
                        <button type="button" @click="showFields = !showFields">Extra Fields</button>
                    </div>
                    <input class="invisible" type="file" name="importKml" id="importKml" @change="importKml">
                </HBox>
                <GoogleMap v-if="selectedTaxon && showMap"
                        api-key="AIzaSyClYri6lQql5nQkCwktcq2DJsjBDpmP_nU"
                        id="mapid"
                        ref="Map"
                        :center="{ lat: 48.856614, lng: 2.3522219 }"
                        :zoom="12">
                    <Marker v-for="(position, index) in specimenLocations"
                        :key="index"
                        :options="{ title: selectedTaxon ? selectedTaxon.name : '', position }"
                    />
                </GoogleMap>
                <split-panel v-if="selectedTaxon" class="flex-grow-1 horizontal-flexbox scroll">
                    <VBox v-if="selectedColumns.includes('props')" :class="['scroll', { 'flex-grow-1': selectedColumns.length == 2 }]">
                        <picture-box :editable="editProperties"
                            @open-photo="openPhoto"
                            @add-photo="addItemPhoto"
                            @set-photo="setItemPhoto"
                            @delete-photo="deleteItemPhoto"
                            :pictures="selectedTaxon.pictures">
                        </picture-box>
                        <collapsible-panel label="Properties">
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
                                        :icon="extraField.icon"
                                        :model-value="extraProperty(extraField)"
                                        @input="setExtraProperty"
                                        :editable="editProperties">
                                    {{ extraField.label }}
                                </item-property-field>
                            </div>
                        </collapsible-panel>
                        <collapsible-panel v-for="book in dataset.books" :key="book.id" :label="book.label">
                            <div v-if="selectedTaxon && selectedTaxon.bookInfoByIds">
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
                                    <TextEditor v-if="editProperties"
                                        v-model="selectedTaxon.bookInfoByIds[book.id].detail">
                                    </TextEditor>
                                    <div v-if="!editProperties" class="limited-width medium-padding" v-html="selectedTaxon.bookInfoByIds[book.id].detail"></div><br/>
                                </div>
                            </div>
                        </collapsible-panel>
                        <collapsible-panel label="Additional Text" id="item-detail">
                            <TextEditor v-if="editProperties" v-model="selectedTaxon.detail"></TextEditor>
                            <div v-if="!editProperties" class="limited-width" v-html="selectedTaxon.detail"></div>
                        </collapsible-panel>
                    </VBox>
                    <VBox v-if="selectedColumns.includes('desc')" class="scroll flex-grow-1">
                        <section class="white-background medium-padding medium-margin thin-border">
                            <a :href="selectedTaxon.website" target="_blank">{{ selectedTaxon.website }}</a>
                        </section>
                        <collapsible-panel label="Description">
                            <SquareTreeViewer class="large-max-width" :name-fields="['S', 'EN', 'CN']" :editable="true" :rootItems="itemDescriptorTree" @item-selection-toggled="taxonStateToggle" @item-open="openCharacter"></SquareTreeViewer>
                        </collapsible-panel>
                    </VBox>
                    <collapsible-panel v-if="selectedColumns.includes('summary')" class="scroll" label="Description">
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
                </split-panel>
            </VBox>
        </HBox>
    </split-panel>
</template>

<script lang="ts">
import SquareTreeViewer from "./SquareTreeViewer.vue";
import TreeMenu from "./toolkit/TreeMenu.vue";
import PopupGalery from "./PopupGalery.vue";
import TaxonPresentation from "./TaxonPresentation.vue";
import ExtraFieldsPanel from "./ExtraFieldsPanel.vue";
import SplitPanel from "./toolkit/SplitPanel.vue";
import PictureBox from "./PictureBox.vue";
import { GoogleMap, Marker } from "vue3-google-map";
import { Book, Character, Dataset, Description, Hierarchy, State, Taxon, taxonCharactersTree, taxonDescriptions, taxonParentChain, taxonFromId } from "@/datatypes"; // eslint-disable-line no-unused-vars
import CollapsiblePanel from "./toolkit/CollapsiblePanel.vue";
import TextEditor from "./toolkit/TextEditor.vue";
import DropDown from "./toolkit/DropDownButton.vue";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import Spacer from "./toolkit/Spacer.vue";
import ColumnSelector from "./ColumnSelector.vue";
import ItemPropertyField from "./ItemPropertyField.vue";
import download from "@/tools/download";
import { createTexExporter, exportZipFolder, importKml } from "@/features";
import { createTaxon, taxonHasState, taxonHasStates } from "@/datatypes/Taxon";
import { createHierarchicalItem } from "@/datatypes/HierarchicalItem";
import { taxonOrAnyChildHasStates } from "@/datatypes/Taxon";
import { normalizePicture } from "@/datatypes/picture";
import { forEachHierarchy, transformHierarchy } from "@/datatypes/hierarchy";
import { createCharacter } from "@/datatypes/Character";
import { DiscreteCharacter, Field, Picture, SelectableItem } from "@/datatypes/types";


export default {
    name: "TaxonsTab",
    components: {
        CollapsiblePanel, DropDown, HBox, ItemPropertyField, PictureBox, Spacer, SquareTreeViewer, VBox,
        GoogleMap, Marker,
        ExtraFieldsPanel, PopupGalery, SplitPanel, TreeMenu, TaxonPresentation,
        ColumnSelector, TextEditor,
    },
    data() {
        return {
            nameFields: [{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }],
            store: Hazo.store,
            showFields: false,
            showBigImage: false,
            showMap: false,
            bigImages: [{ id: "", url: "", label: "", hubUrl: "" }] as Picture[],
            editProperties: true,
            latexProgressText: "",
            selectingParent: false,
            selectedTaxonId: this.$route.params.id as string ?? "",
            selectedColumns: ["menu", "props"]
        }
    },
    watch: {
        $route(to: any) {
            this.selectedTaxonId = to.params.id;
            if (this.selectedTaxon) {
                this.store.do("selectTaxon", this.selectedTaxon);
            }
        },
    },
    computed: {
        leftMenuSize(): number {
            return this.selectedColumns.includes("menu") ? 25 : 0;
        },
        rightPaneSize(): number {
            return this.selectedColumns.includes("menu") ? 75 : 100;
        },
        dataset(): Dataset {
            return this.store.dataset as Dataset;
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
            return taxonFromId(this.dataset, this.selectedTaxonId);
        },
        specimenLocations(): { lat: number, lng: number }[] {
            return this.selectedTaxon?.specimenLocations ?? [];
        },
        itemDescriptorTree(): Hierarchy<SelectableItem> {
            if (typeof this.selectedTaxon !== "undefined") {
                return taxonCharactersTree(this.selectedTaxon, this.dataset.charactersHierarchy);
            } else {
                return createCharacter({ id: "c0", name: { S: '' }, detail: ""});
            }
        },
        itemDescription(): Description[] {
            if (typeof this.selectedTaxon === "undefined") {
                return [];
            } else {
                return taxonDescriptions(this.dataset, this.selectedTaxon);
            }
        }
    },
    methods: {
        taxonParentChain(ds: Dataset, id: string | undefined): Taxon[] {
            return taxonParentChain(ds, id);
        },
        zoomColumn(col: string) {
            this.selectedColumns = ["menu", col];
        },
        addColumn(col: string) {
            this.selectedColumns = [...this.selectedColumns, col];
        },
        removeColumn(col: string) {
            this.selectedColumns = this.selectedColumns.filter(c => c != col);
        },
        pushStateToChildren(state: State) {
            if (typeof this.selectedTaxon === "undefined") return;
            forEachHierarchy(this.selectedTaxon, child => {
                this.dataset.setTaxonState(child.id, state);
            });
        },
        async importKml(e: Event) {
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
        moveUp(item: Taxon) {
            this.store.do("moveTaxonUp", item);
        },
        moveDown(item: Taxon) {
            this.store.do("moveTaxonDown", item);
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
                ...createHierarchicalItem({ id: "", name: { S: name, V: vernacularName, CN: nameCN}, detail: "", pictures: [], }),
                bookInfoByIds: Object.fromEntries(this.dataset.books!.map((book: Book) => [book.id, { fasc: "", page: undefined, detail: "" }])),
                parentId: e.parentId
            }));
        },
        removeTaxon(e: { itemId: string }) {
            const taxonToRemove = taxonFromId(this.dataset, e.itemId);
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
            const ch = e.item as Character;
            const isDiscreteCharacter = ch.type === "character" && ch.characterType === "discrete";
            const stateToAdd = isDiscreteCharacter ? (ch as DiscreteCharacter).inherentState : e.item as State;

            if (typeof this.selectedTaxon !== "undefined" && typeof stateToAdd !== "undefined") {
                const selected = !taxonHasState(this.selectedTaxon, stateToAdd);
                this.store.do("setTaxonState", { taxon: this.selectedTaxon, state: stateToAdd, has: selected });
            }
        },
        openCharacter(e: { item: DiscreteCharacter }) {
            if (e.item.inherentState && this.selectedTaxon && ! taxonHasState(this.selectedTaxon, e.item.inherentState)) {
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
        openPhoto(_: Event & {detail: { index: number }}) {
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
};
</script>