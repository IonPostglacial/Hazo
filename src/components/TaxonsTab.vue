<template>
    <div class="horizontal-flexbox start-align flex-grow-1 no-vertical-overflow">
        <nav v-if="showLeftMenu" class="scroll white-background no-print">
            <TreeMenu :editable="editable" :items="dataset.taxonsHierarchy" :selected-item="selectedTaxon ? selectedTaxon.id : ''" 
                :name-fields="[{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }]"
                @add-item="addTaxon" @unselected="selectedTaxonId = undefined" @delete-item="removeTaxon" v-slot="menuProps">
                <router-link class="flex-grow-1 nowrap unstyled-anchor" :to="'/taxons/' + menuProps.item.id">{{ menuProps.item.name }}</router-link>
            </TreeMenu>
        </nav>
        <popup-galery :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></popup-galery>
        <extra-fields-panel :showFields="showFields" :extraFields="dataset.extraFields" @closed="showFields = false"></extra-fields-panel>
        <div class="vertical-flexbox flex-grow-1">
            <div class="horizontal-flexbox space-between no-print medium-padding thin-border">
                <div class="horizontal-flexbox">
                    <div class="button-group">
                        <button type="button" @click="showLeftMenu = !showLeftMenu">Left Menu</button>
                        <button type="button" @click="showMap = !showMap">Map</button>
                    </div>
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
                            <TreeMenu :items="dataset.taxonsHierarchy"
                                :name-fields="[{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }]"
                                @select-item="changeSelectedTaxonParent">
                            </TreeMenu>
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
            <taxon-presentation v-if="mode === 'present-item'"
                @taxon-selected="selectTaxon" :show-left-menu="showLeftMenu"
                :selected-taxon-id="selectedTaxonId" :dataset="dataset">
            </taxon-presentation>
            <section v-if="(mode !== 'present-item' && typeof selectedTaxon !== 'undefined')" class="flex-grow-1 horizontal-flexbox scroll">
                <div class="vertical-flexbox scroll">
                    <picture-box :editable="editable ? 'editable' : ''"
                            @open-photo="openPhoto"
                            @add-photo="addItemPhoto"
                            @set-photo="setItemPhoto"
                            @delete-photo="deleteItemPhoto">
                        <picture-frame v-for="(photo, index) in selectedTaxon.pictures" :key="photo.id"
                            :index="index" :editable="editable ? 'editable' : ''" :pictureid="photo.id" :url="photo.url" :label="photo.label">
                        </picture-frame>
                    </picture-box>
                    <div class="horizontal-flexbox start-align relative">
                        <collapsible-panel label="Properties" 
                                v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">
                            <div class="scroll large-max-width">
                                <div v-if="!editable">
                                    <label class="item-property">NS</label>
                                    <div class="inline-block medium-padding medium-margin"><i>{{ selectedTaxon.name.S }}</i> {{ selectedTaxon.author }}</div>
                                </div>
                                <div v-if="editable">
                                    <label class="item-property">NS</label>
                                    <input class="italic" type="text" lang="lat" spellcheck="false" v-model="selectedTaxon.name.S" /><br>
                                    <label class="item-property">Author</label>
                                    <input type="text" v-model="selectedTaxon.author" />
                                </div>
                                <item-property-field property="name2" :value="selectedTaxon.name2" :editable="editable">
                                    Synonymous</item-property-field>
                                <item-property-field property="nameCN" :value="selectedTaxon.name.CN" :editable="editable">
                                    中文名</item-property-field>
                                <item-property-field property="vernacularName" :value="selectedTaxon.name.V" :editable="editable">
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
                                <div v-for="extraField in dataset.extraFields" :key="extraField.id">
                                    <item-property-field :property="extraField.id" :icon="extraField.icon" :value="selectedTaxon.extra[extraField.id]" :editable="editable">
                                        {{ extraField.label }}</item-property-field>
                                </div>
                            </div>
                        </collapsible-panel>
                    </div>
                    <collapsible-panel v-for="book in dataset.books" :key="book.id" :label="book.label">
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
                </div>
                <div class="vertical-flexbox scroll flex-grow-1">
                    <collapsible-panel label="Description">
                        <SquareTreeViewer class="large-max-width" :name-fields="['S', 'EN', 'CN']" :editable="editable" :rootItems="itemDescriptorTree" @item-selection-toggled="taxonStateToggle" @item-open="openCharacter"></SquareTreeViewer>
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
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Book, Character, Dataset, DetailData, HierarchicalItem, Hierarchy, Picture, State, Taxon } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import download from "@/tools/download";
import exportStatistics from "@/features/exportstats";
import { TexExporter, exportZipFolder, importKml } from "@/features";


export default Vue.extend({
    name: "TaxonsTab",
    components: { SquareTreeViewer, ckeditor: CKEditor.component, ExtraFieldsPanel, PopupGalery, TreeMenu, TaxonPresentation },
    data() {
        return {
            store: Hazo.store,
            showLeftMenu: true,
            showFields: false,
            showBigImage: false,
            showMap: false,
            bigImages: [{ id: "", url: "", label: "" }],
            mode: "edit-item",
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
        }
    },
    computed: {
        dataset(): Dataset {
            return this.store.dataset;
        },
        editable(): boolean {
            return this.mode === "edit-item";
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
    },
    methods: {
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
            this.store.do("addTaxon", new Taxon({
                ...new DetailData({ id: "", name: { S: name, V: vernacularName, CN: nameCN}, pictures: [], }),
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
        pushToChildren(e: { detail: string }) {
            for (const child of this.dataset.taxonsHierarchy!.childrenOf(this.selectedTaxon)) {
                const anyChild: any = child, anyItem: any = this.selectedTaxon;
                anyChild[e.detail] = anyItem[e.detail];
            }
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
            e.stopPropagation();
            console.log("open my photo");
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