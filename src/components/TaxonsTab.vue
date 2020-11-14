<template>
    <div class="horizontal-flexbox start-align flex-grow-1">
        <nav v-if="showLeftMenu" class="scroll thin-border white-background no-print">
            <TreeMenu :editable="editable" :items="taxonsHierarchy" :selected-item="selectedTaxon ? selectedTaxon.id : ''" 
                :name-fields="[{ label: 'NS', propertyName: 'name' }, { label: 'NV', propertyName: 'vernacularName'}, { label: '中文名', propertyName: 'nameCN' }]"
                @select-item="selectTaxon" @add-item="addTaxon" @delete-item="removeTaxon">
            </TreeMenu>
        </nav>
        <extra-fields-panel :showFields="showFields" :extraFields="extraFields" @closed="showFields = false">
        </extra-fields-panel>
        <div class="vertical-flexbox flex-grow-1">
            <div class="horizontal-flexbox space-between no-print medium-padding thin-border">
                <div class="horizontal-flexbox">
                    <button type="button" @click="showLeftMenu = !showLeftMenu">Left Menu</button>
                    <span class="medium-margin">Mode:</span>
                    <div class="button-group">
                        <button type="button" :class="{ 'selected-tab': mode === 'view-item' }" @click="mode = 'view-item'">View</button>
                        <button type="button" :class="{ 'selected-tab': mode === 'edit-item' }" @click="mode = 'edit-item'">Edit</button>
                        <button type="button" :class="{ 'selected-tab': mode === 'present-item' }" @click="mode = 'present-item'">Print</button>
                    </div>
                </div>
                <div v-if="selectedTaxon" class="relative">
                    <div v-if="selectingParent">
                        <button type="button" @click="closeSelectParentDropdown" class="background-color-1">select parent</button>
                        <div class="absolute white-background thin-border big-max-height medium-padding scroll" style="top:32px;">
                            <TreeMenu :items="taxonsHierarchy"
                                :name-fields="[{ label: 'NS', propertyName: 'name' }, { label: 'NV', propertyName: 'vernacularName'}, { label: '中文名', propertyName: 'nameCN' }]"
                                @select-item="changeSelectedTaxonParent">
                            </TreeMenu>
                        </div>
                    </div>
                    <div v-if="!selectingParent" class="button-group">
                        <button type="button" v-for="parent in taxonsHierarchy.parentsOf(selectedTaxon)" :key="parent.id" @click="selectTaxon(parent.id)">{{ parent.name }}</button>
                        <button type="button" @click="openSelectParentDropdown" class="background-color-1">{{ selectedTaxon.name }}</button>
                    </div>
                </div>
                <div class="button-group">
                    <button type="button" @click="emptyZip">Folders</button>
                    <button type="button" @click="texExport">Latex{{latexProgressText}}</button>
                    <button type="button" @click="exportStats">Stats</button>
                    <button type="button" @click="showFields = !showFields">Extra Fields</button>
                </div>
            </div>
            <taxon-presentation v-if="mode === 'present-item'"
                @taxon-selected="selectTaxon" :show-left-menu="showLeftMenu"
                :selected-taxon-id="selectedTaxonId" :taxons-hierarchy="taxonsHierarchy" :characters="characters.allItems">
            </taxon-presentation>
            <section v-if="mode !== 'present-item' && typeof selectedTaxon !== 'undefined'" class="flex-grow-1 horizontal-flexbox scroll">
                <div class="vertical-flexbox scroll">
                    <picture-box :editable="editable"
                            @open-photo="openPhoto"
                            @add-photo="addItemPhoto"
                            @set-photo="setItemPhoto" 
                            @delete-photo="deleteItemPhoto">
                        <picture-frame v-for="(photo, index) in selectedTaxon.photos" :key="photo.id"
                            :index="index" :editable="editable" :pictureid="photo.id" :url="photo.url" :label="photo.label"></picture-frame>
                    </picture-box>
                    <div class="horizontal-flexbox start-align relative">
                        <collapsible-panel label="Properties" 
                                v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">
                            <div class="scroll large-max-width">
                                <div v-if="!editable">
                                    <label class="item-property">NS</label>
                                    <div class="inline-block medium-padding medium-margin"><i>{{ selectedTaxon.name }}</i> {{ selectedTaxon.author }}</div>
                                </div>
                                <div v-if="editable">
                                    <label class="item-property">NS</label>
                                    <input class="italic" type="text" lang="lat" spellcheck="false" v-model="selectedTaxon.name" /><br>
                                    <label class="item-property">Author</label>
                                    <input type="text" v-model="selectedTaxon.author" />
                                </div>
                                <item-property-field property="name2" :value="selectedTaxon.name2" :editable="editable">
                                    Synonymous</item-property-field>
                                <item-property-field property="nameCN" :value="selectedTaxon.nameCN" :editable="editable">
                                    中文名</item-property-field>
                                <item-property-field property="vernacularName" :value="selectedTaxon.vernacularName" :editable="editable">
                                    NV</item-property-field>
                                <item-property-field property="vernacularName2" :value="selectedTaxon.vernacularName2" :editable="editable">
                                    NV 2</item-property-field>

                                <label class="item-property">Website</label>
                                <input v-if="editable" type="text" v-model="selectedTaxon.website" />
                                <a v-if="!editable" target="_blank" :href="selectedTaxon.website">{{ selectedTaxon.website }}</a><br/>

                                <label class="item-property">Meaning</label>
                                <textarea :readonly="!editable"  v-model="selectedTaxon.meaning"></textarea><br/>

                                <item-property-field property="noHerbier" :value="selectedTaxon.noHerbier" :editable="editable">
                                    N° Herbier</item-property-field>
                                <item-property-field property="herbariumPicture" :value="selectedTaxon.herbariumPicture" :editable="editable">
                                    Herbarium Picture</item-property-field>
                                <div v-for="extraField in extraFields" :key="extraField.id">
                                    <item-property-field :property="extraField.id" :icon="extraField.icon" :value="selectedTaxon.extra[extraField.id]" :editable="editable">
                                        {{ extraField.label }}</item-property-field>
                                </div>
                            </div>
                        </collapsible-panel>
                    </div>
                </div>
                <div class="vertical-flexbox scroll flex-grow-1">
                    <collapsible-panel v-for="book in books" :key="book.id" :label="book.label">
                        <div v-if="selectedTaxon.bookInfoByIds">
                            <div v-if="selectedTaxon.bookInfoByIds[book.id]">
                                <label class="medium-margin">
                                    book:&nbsp;
                                    <input v-if="editable" type="text" v-model="selectedTaxon.bookInfoByIds[book.id].fasc" />
                                    <div class="inline-block medium-padding medium-margin" v-if="!editable">
                                        {{ selectedTaxon.bookInfoByIds[book.id].fasc }}
                                    </div>
                                </label>
                                <label class="medium-margin">
                                    page:&nbsp;
                                    <input v-if="editable" type="text" v-model="selectedTaxon.bookInfoByIds[book.id].page" />
                                    <div class="inline-block medium-padding medium-margin" v-if="!editable">
                                        {{ selectedTaxon.bookInfoByIds[book.id].page }}
                                    </div>
                                </label>
                                <ckeditor v-if="editable" :editor="editor" v-model="selectedTaxon.bookInfoByIds[book.id].detail" :config="editorConfig"></ckeditor>
                                <div v-if="!editable" class="limited-width medium-padding" v-html="selectedTaxon.bookInfoByIds[book.id].detail"></div><br/>
                            </div>
                        </div>
                    </collapsible-panel>
                    <collapsible-panel label="Additional Text" id="item-detail">
                        <ckeditor v-if="editable" :editor="editor" v-model="selectedTaxon.detail" :config="editorConfig"></ckeditor>
                        <div v-if="!editable" class="limited-width" v-html="selectedTaxon.detail"></div>
                    </collapsible-panel>
                    <collapsible-panel label="Description">
                        <SquareTreeViewer class="large-max-width" :name-fields="['name', 'nameEN', 'nameCN']" :editable="editable" :rootItems="itemDescriptorTree" @item-selection-toggled="taxonStateToggle" @item-open="openCharacter"></SquareTreeViewer>
                    </collapsible-panel>
                </div>
            </section>
        </div>
    </div>
</template>

<script lang="ts">
import SquareTreeViewer from "./SquareTreeViewer.vue";
import TreeMenu from "./TreeMenu.vue";
import TaxonPresentation from "./TaxonPresentation.vue";
import ExtraFieldsPanel from "./ExtraFieldsPanel.vue";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Book, Character, Picture, State, Taxon, TexExporter, exportZipFolder } from "../bunga"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Hierarchy } from '@/bunga/hierarchy';
import clone from '@/clone';
import { createDetailData } from '@/bunga/DetailData';
import { createTaxon } from '@/bunga/Taxon';
import { ObservableMap } from '@/observablemap';
import download from "../download";
import exportStatistics from "../bunga/features/exportstats";

export default Vue.extend({
    name: "TaxonsTab",
    components: { SquareTreeViewer, ckeditor: CKEditor.component, ExtraFieldsPanel, TreeMenu, TaxonPresentation },
    props: {
        characters: Object as PropType<Hierarchy<Character>>,
        taxonsHierarchy: Object as PropType<Hierarchy<Taxon>>,
        extraFields: Array,
        selectedTaxonId: String,
        books: Array as PropType<Array<Book>>,
    },
    data() {
        return {
            showLeftMenu: true,
            showFields: false,
            mode: "view-item",
            editor: ClassicEditor,
            editorConfig: {},
            latexProgressText: "",
            selectingParent: false,
        }
    },
    computed: {
        editable(): boolean {
            return this.mode === "edit-item";
        },
        selectedTaxon(): Taxon|undefined {
            return this.taxonsHierarchy?.itemWithId(this.selectedTaxonId);
        },
        itemDescriptorTree(): Hierarchy<Character & { selected?: boolean }> {
            if (typeof this.selectedTaxon === "undefined") return new Hierarchy<Character & { selected?: boolean }>("c", new ObservableMap());
            const selectedTaxon = this.selectedTaxon;

            const dependencyHierarchy: Hierarchy<Character & { selected?: boolean }> = clone(this.characters!);

            for (const character of this.characters!.allItems) {
                if (typeof character.requiredStates === "undefined") {
                    console.log(character)
                }
                const taxonLacksRequiredStates = !character.requiredStates.every(requiredState => selectedTaxon.statesSelection[requiredState.id] ?? false);
                const taxonHasSomeInapplicableState = character.inapplicableStates.some(inapplicableState => selectedTaxon.statesSelection[inapplicableState.id] ?? false);

                if (taxonLacksRequiredStates || taxonHasSomeInapplicableState) {
                    dependencyHierarchy.remove(character);
                } else {
                    const characterStates = character.states.map(s => Object.assign({ type: "state", parentId: s.descriptorId, selected: selectedTaxon.statesSelection[s.id] ?? false }, s));
                    const characterChildren = [...dependencyHierarchy.childrenOf(character)];
                    
                    for (const state of characterStates) {
                        const inherentCharacter = characterChildren.find(characterChild => characterChild.inherentState?.id === state.id);
                        if(typeof inherentCharacter === "undefined") {
                            dependencyHierarchy.add(state as unknown as Character);
                        } else {
                            inherentCharacter.selected = state.selected;
                        }
                    }
                }
            }
            return dependencyHierarchy;
        },
    },
    methods: {
        openSelectParentDropdown() {
            this.selectingParent = true;
        },
        closeSelectParentDropdown() {
            this.selectingParent = false;
        },
        changeSelectedTaxonParent(id: string) {
            this.$store.commit("changeTaxonParent", { taxon: this.selectedTaxon, newParentId: id });
            this.selectingParent = false;
        },
        selectTaxon(id: string) {
            this.$emit("taxon-selected", id);
        },
        addTaxon(e: {value: string, parentId: string }) {
            this.$store.commit("addTaxon", createTaxon({
                ...createDetailData({ id: "", name: e.value, photos: [], }),
                bookInfoByIds: Object.fromEntries(this.books!.map((book: Book) => [book.id, { fasc: "", page: undefined, detail: "" }])),
                parentId: e.parentId, childrenIds: []
            }));
        },
        removeTaxon(e: { itemId: string }) {
            this.$store.commit("removeTaxon", this.taxonsHierarchy?.itemWithId(e.itemId));
        },
        setProperty(e: { detail: { property: string, value: string } }) {
            (this.selectedTaxon as any)[e.detail.property] = e.detail.value;
        },
        setExtraProperty(e: { detail: { property: string, value: string } }) {
            this.selectedTaxon!.extra[e.detail.property] = e.detail.value;
        },
        pushToChildren(e: { detail: string }) {
            for (const child of this.taxonsHierarchy!.childrenOf(this.selectedTaxon)) {
                const anyChild: any = child, anyItem: any = this.selectedTaxon;
                anyChild[e.detail] = anyItem[e.detail];
            }
        },
        taxonStateToggle(e: { item: State|Character }) {
            const isCharacter = (e.item as Character).type === "character";
            const stateToAddId = isCharacter ? (e.item as Character).inherentState?.id : e.item.id;

            if (typeof this.selectedTaxon !== "undefined" && typeof stateToAddId !== "undefined") {
                const selected = !this.selectedTaxon.statesSelection[stateToAddId];
                const newStateSelection = { ...this.selectedTaxon.statesSelection, [stateToAddId]: selected };
                this.$store.commit("addTaxon", { ...this.selectedTaxon, statesSelection: newStateSelection });
            }
        },
        openCharacter(e: { item: Character }) {
            if (e.item.inherentState && this.selectedTaxon && !this.selectedTaxon.statesSelection[e.item.inherentState.id]) {
                this.taxonStateToggle({ item: e.item.inherentState });
            }
        },
        addItemPhoto(e: {detail: { value: string }}) {
            if (typeof this.selectedTaxon === "undefined") {
                console.warn("Trying to add a photo but no taxon selected.");
                return;
            }
            const numberOfPhotos = this.selectedTaxon.photos.length;
            this.$store.commit("addTaxonPicture", { taxon: this.selectedTaxon, picture: { id: `${this.selectedTaxon.id}-${numberOfPhotos}`, url: e.detail.value, label: e.detail.value } });
        },
        setItemPhoto(e: {detail: {index: number, value: string}}) {
            this.$store.commit("setTaxonPicture", {
                taxon: this.selectedTaxon,
                index: e.detail.index,
                picture: { ...this.selectedTaxon!.photos[e.detail.index], url: e.detail.value },
            });
        },
        deleteItemPhoto(e: {detail: { index: number }}) {
            this.$store.commit("removeTaxonPicture", { taxon: this.selectedTaxon, index: e.detail.index });
        },
        openPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.selectedTaxon!.photos});
        },
        async emptyZip() {
            const zipTxt = await exportZipFolder(this.taxonsHierarchy!);
            download(zipTxt, "zip", true);
        },
        texExport() {
            const taxonToTex = new TexExporter([...this.taxonsHierarchy!.allItems], this.characters!.allItems);
            taxonToTex.onProgress((current, max) =>  { this.latexProgressText = " [" + current + " / " + max + "]" });
            taxonToTex.export().then(tex => {
                download(tex, "zip", true);
            });
        },
        exportStats() {
            const csv = exportStatistics(this.taxonsHierarchy!);
            download(csv, "csv");
        },
    }
});
</script>