<template>
    <split-panel class="horizontal-flexbox start-align flex-grow-1 no-vertical-overflow">
        <tree-menu v-if="selectedColumns.includes('menu')" class="scroll white-background no-print" :editable="true" :items="taxonTree" :selected-item="selectedTaxon ? selectedTaxon.id : ''" 
            :name-store="nameStore"
            :name-fields="nameFields"
            @move-item-up="moveUp" @move-item-down="moveDown"
            @add-item="addTaxonHandler" @unselected="selectedTaxonId = ''" @delete-item="removeTaxonHandler" v-slot="menuProps">
            <router-link class="flex-grow-1 nowrap unstyled-anchor" :to="'/taxons/' + menuProps.item.id">{{ menuProps.item.name }}</router-link>
        </tree-menu>
        <HBox class="scroll flex-grow-1">
            <popup-galery :title="selectedTaxon?.name.S" :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></popup-galery>
            <extra-fields-panel :showFields="showFields" :extraFields="extraFields" @closed="showFields = false"></extra-fields-panel>
            <VBox class="flex-grow-1">
                <HBox class="no-print medium-padding thin-border">
                    <button v-if="selectedColumns.includes('menu')" @click="removeColumn('menu')">
                        <font-awesome-icon icon="fa-solid fa-arrow-left" />
                    </button>
                    <div class="button-group">
                        <button v-for="col in minimizedColumns" @click="addColumn(col)">
                            {{ columnName(col) }}
                        </button>
                    </div>
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
                            <div class="absolute white-background thin-border big-max-height scroll over-everything width-l" style="top:32px;">
                                <tree-menu :items="taxonTree"
                                    :name-fields="nameFields"
                                    @select-item="changeSelectedTaxonParent" v-slot="menuProps">
                                    <div>{{ menuProps.item.name }}</div>
                                </tree-menu>
                            </div>
                        </div>
                        <div v-if="!selectingParent" class="button-group">
                            <button type="button" v-for="parent in taxonParentChain(selectedTaxon.id)" :key="parent.id" @click="selectTaxon(parent)">{{ parent.name.S }}</button>
                            <button type="button" @click="openSelectParentDropdown" class="background-color-1">
                                {{ selectedTaxon.name.S }}
                                <font-awesome-icon icon="fa-solid fa-caret-down" />
                            </button>
                        </div>
                    </div>
                    <Spacer></Spacer>
                    <DropDownButton label="Export">
                        <VBox>
                            <label class="button" for="importKml">KML</label>
                            <button @click="exportCSV">CSV</button>
                            <button type="button" @click="emptyZip">Folders</button>
                            <button type="button" @click="texExport">Latex{{latexProgressText}}</button>
                            <router-link class="button" to="/taxons-stats">Stats</router-link>
                        </VBox>
                    </DropDownButton>
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
                        <ColumnHeader class="stick-to-top" label="Properties"
                            @minimize="removeColumn('props')"
                            @maximize="zoomColumn('props')"></ColumnHeader>
                        <picture-box :editable="editProperties"
                            @open-photo="openPhoto"
                            @add-photo="addItemPhoto"
                            @set-photo="setItemPhoto"
                            @delete-photo="deleteItemPhoto"
                            :pictures="selectedTaxon.pictures">
                        </picture-box>
                        <collapsible-panel label="Properties">
                            <div class="scroll large-max-width form-grid medium-padding">
                                <div class="display-contents">
                                    <label>NS</label>
                                    <input class="italic" type="text" lang="lat" spellcheck="false" v-model="name.S" />
                                    <label>Author</label>
                                    <input type="text" v-model="selectedTaxon.author" />
                                </div>
                                <item-property-field v-model="selectedTaxon.name2" :editable="editProperties">
                                    Synonymous</item-property-field>
                                <item-property-field v-model="name.CN" :editable="editProperties">
                                    中文名</item-property-field>
                                <item-property-field v-model="name.V" :editable="editProperties">
                                    NV</item-property-field>
                                <item-property-field v-model="selectedTaxon.vernacularName2" :editable="editProperties">
                                    NV 2</item-property-field>

                                <label>Website</label>
                                <input type="text" v-model="selectedTaxon.website" />

                                <label>Meaning</label>
                                <textarea :readonly="!editProperties" v-model="selectedTaxon.meaning"></textarea>

                                <item-property-field v-model="selectedTaxon.noHerbier" :editable="editProperties">
                                    N° Herbier</item-property-field>
                                <item-property-field v-model="selectedTaxon.herbariumPicture" :editable="editProperties">
                                    Herbarium Picture</item-property-field>
                                <item-property-field v-for="extraField in extraFields" :key="extraField.id"
                                        :icon="extraField.icon"
                                        :model-value="extraProperty(extraField)"
                                        @input="setExtraProperty"
                                        :editable="editProperties">
                                    {{ extraField.label }}
                                </item-property-field>
                            </div>
                        </collapsible-panel>
                        <collapsible-panel v-for="book in books" :key="book.id" :label="book.label">
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
                        <ColumnHeader class="stick-to-top" label="Descriptors"
                            @minimize="removeColumn('desc')"
                            @maximize="zoomColumn('desc')">
                        </ColumnHeader>
                        <SquareTreeViewer class="large-max-width" 
                            :name-fields="['S', 'EN', 'CN']" 
                            :rootItems="itemDescriptorTree"
                            :selected-items="selectedStateIds"
                            @item-selection-toggled="taxonStateToggle" 
                            @item-open="openCharacter">
                        </SquareTreeViewer>
                    </VBox>
                    <VBox v-if="selectedColumns.includes('summary')" class="scroll">
                        <ColumnHeader class="stick-to-top" label="Summary"
                            @minimize="removeColumn('summary')"
                            @maximize="zoomColumn('summary')">
                        </ColumnHeader>
                        <section v-if="selectedTaxon.website.length > 0" class="white-background medium-padding medium-margin thin-border">
                            <a :href="selectedTaxon.website" target="_blank">{{ selectedTaxon.website }}</a>
                        </section>
                        <div class="thin-border medium-margin white-background flex-grow-1">
                            <HBox>
                                <div class="inline-block medium-padding medium-margin"><i>{{ selectedTaxon.name.S }}</i> {{ selectedTaxon.author }}</div>
                                <Spacer></Spacer>
                                <select name="lang" id="lang-selector" v-model="selectedSummaryLangId">
                                    <option v-for="(language, index) in charNameFields" :key="language.label" :value="index">{{ language.label }}</option>
                                </select>
                            </HBox>
                            <ul class="big-margin-left">
                                <li v-for="desc in taxonDescriptions(selectedTaxon)" :key="desc.character.id">
                                    {{ desc.character.name[selectedSummaryLangProperty] }}
                                    <GeoView 
                                        v-if="desc.character.characterType === 'discrete' && desc.character.preset === 'map'"
                                        :geo-map="getGeoMap(desc.character)"
                                        :selected-features="desc.states.map(s => s.name.S)">
                                    </GeoView>
                                    <ul v-if="desc.states.length > 0 && !(desc.character.characterType === 'discrete' && desc.character.preset === 'flowering')" class="indented">
                                        <li v-for="state in desc.states" :key="state.id">
                                            {{ state.name[selectedSummaryLangProperty] }}<a class="button" href="#1" @click="pushStateToChildren(state)">Push to children</a>
                                        </li>
                                    </ul>
                                </li>
                                <li>
                                    Calendar
                                    <ul>
                                        <li v-for="track in calendarTracks">
                                            <span :style="'color:' + track.color">{{ track.name }}</span>
                                        </li>
                                    </ul>
                                    <Flowering
                                        :model-value="calendarTracks"
                                        class="limited-width">
                                    </Flowering>
                                </li>
                            </ul>
                        </div>
                    </VBox>
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
import GeoView from "./GeoView.vue";
import PictureBox from "./PictureBox.vue";
import { GoogleMap, Marker } from "vue3-google-map";
import { Book, Character, Description, Hierarchy, State, Taxon, getCharacterMap } from "@/datatypes"; // eslint-disable-line no-unused-vars
import CollapsiblePanel from "./toolkit/CollapsiblePanel.vue";
import TextEditor from "./toolkit/TextEditor.vue";
import DropDownButton from "./toolkit/DropDownButton.vue";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import Spacer from "./toolkit/Spacer.vue";
import ColumnHeader from "./toolkit/ColumnHeader.vue";
import ItemPropertyField from "./ItemPropertyField.vue";
import download from "@/tools/download";
import { exportZipFolder, importKml } from "@/features";
import { createTaxon, taxonHasState, taxonHasStates } from "@/datatypes/Taxon";
import { createHierarchicalItem } from "@/datatypes/HierarchicalItem";
import { taxonOrAnyChildHasStates } from "@/datatypes/Taxon";
import { normalizePicture } from "@/datatypes/picture";
import { forEachHierarchy, transformHierarchy } from "@/datatypes/hierarchy";
import { createCharacter } from "@/datatypes/Character";
import { DiscreteCharacter, Field, GeoMap, Picture, BasicInfo } from "@/datatypes/types";
import { escape } from "@/tools/parse-csv";
import { familyNameStore } from "@/db-index";
import Flowering, { Track } from "./Flowering.vue";
import Months from "@/datatypes/Months";
import { mapActions, mapState } from "pinia";
import { useHazoStore } from "@/stores/hazo";
import { useDatasetStore } from "@/stores/dataset";
import { multilangTextEquals } from "@/tools/multilangtextequal";
import debounce from "@/tools/debounce";


const columns = ["menu", "props", "desc", "summary"];
const columnNames: Record<string, string> = { 
    menu: "Menu", 
    props: "Properties",
    desc: "Descriptions", 
    summary: "Summary"
};

const palette = ["#84bf3d", "red", "blue", "orange", "purple"];

export default {
    name: "TaxonsTab",
    components: {
        CollapsiblePanel, DropDownButton, HBox, ItemPropertyField, PictureBox, Spacer, SquareTreeViewer, VBox,
        GeoView, GoogleMap, Marker,
        ExtraFieldsPanel, PopupGalery, SplitPanel, TreeMenu, TaxonPresentation,
        ColumnHeader, TextEditor,
        Flowering
    },
    data() {
        const selectedCols = (""+localStorage.selectedTaxonColumns)
            .split(",")
            .filter(col => columns.includes(col));
        const selectedTaxonId = this.$route.params.id as string ?? "";
        const store = useDatasetStore();
        const taxon = store.taxonWithId(selectedTaxonId);
        const taxonNameFields = [{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }];
        const name = Object.fromEntries(taxonNameFields.map(field => [field.propertyName, taxon?.name[field.propertyName] ?? ""]));
        return {
            name,
            nameFields: taxonNameFields,
            charNameFields: [{ label: 'FR', propertyName: 'S'}, { label: 'EN', propertyName: 'EN' }, { label: '中文名', propertyName: 'CN' }],
            nameStore: familyNameStore,
            selectedSummaryLangId: 0,
            showFields: false,
            showBigImage: false,
            showMap: false,
            bigImages: [{ id: "", url: "", label: "", hubUrl: "" }] as Picture[],
            editProperties: true,
            latexProgressText: "",
            selectingParent: false,
            selectedTaxonId,
            selectedColumns: (selectedCols.length > 0) ? selectedCols : ["menu", "props"],
        }
    },
    watch: {
        $route(to: any) {
            this.selectedTaxonId = to.params.id;
            if (this.selectedTaxon) {
                this.selectTaxon(this.selectedTaxon);
            }
        },
        selectedTaxon() {
            if (this.selectedTaxon) {
                Object.assign(this.name, this.selectedTaxon.name);
            }
        },
        selectedColumns() {
            localStorage.selectedTaxonColumns = this.selectedColumns.join(",");
        },
        "name": {
            handler: debounce(500, function (this: any) {
                if (this.selectedTaxon && !multilangTextEquals(this.selectedTaxon.name, this.name)) {
                    this.setTaxon({ taxon: this.selectedTaxon, props: { name: {...this.name} } });
                }
            }),
            deep: true,
        },
    },
    computed: {
        ...mapState(useHazoStore, ["statesAllowList", "statesDenyList"]),
        ...mapState(useDatasetStore, ["books", "charactersHierarchy", "extraFields", "taxonsHierarchy"]),
        selectedStateIds(): string[] {
            return this.selectedTaxon?.states.map(s => s.id) ?? [];
        },
        minimizedColumns(): string[] {
            return columns.filter(col => !this.selectedColumns.includes(col));
        },
        selectedSummaryLangProperty(): string {
            return this.charNameFields[this.selectedSummaryLangId].propertyName;
        },
        leftMenuSize(): number {
            return this.selectedColumns.includes("menu") ? 25 : 0;
        },
        rightPaneSize(): number {
            return this.selectedColumns.includes("menu") ? 75 : 100;
        },
        taxonTree(): Taxon {
            if (this.statesAllowList.length > 0 || this.statesDenyList.length > 0) {
                return transformHierarchy(this.taxonsHierarchy, {
                    map: t => t,
                    filter: t => taxonOrAnyChildHasStates(t, this.statesAllowList) && 
                        (this.statesDenyList.length == 0 || !taxonHasStates(t, this.statesDenyList)),
                });
            } else {
                return this.taxonsHierarchy;
            }
        },
        selectedTaxon(): Taxon|undefined {
            return this.taxonWithId(this.selectedTaxonId);
        },
        specimenLocations(): { lat: number, lng: number }[] {
            return this.selectedTaxon?.specimenLocations ?? [];
        },
        itemDescriptorTree(): Hierarchy<BasicInfo> {
            if (typeof this.selectedTaxon !== "undefined") {
                return this.taxonCharactersTree(this.selectedTaxon, this.charactersHierarchy);
            } else {
                return createCharacter({ id: "c0", name: { S: '' }, detail: ""});
            }
        },
        itemFloweringDescription(): Description[] {
            return this.taxonDescriptions(this.selectedTaxon)
                .filter(
                    desc => desc.character.characterType === "discrete" && 
                    desc.character.preset === "flowering"
                );
        },
        calendarTracks(): Track[] {
            const tracks: Track[] = [];
            let color = 0;
            for (const desc of this.itemFloweringDescription) {
                if (desc.character.characterType !== "discrete" || desc.character.preset !== "flowering") {
                    continue;
                }
                tracks.push({
                    name: desc.character.name.S,
                    color: desc.character.color ?? palette[color++],
                    data: Months.fromStates(desc.states),
                });
                if (color >= palette.length) { color = 0; }
            }
            return tracks;
        },
    },
    methods: {
        ...mapActions(useHazoStore, ["pasteTaxon", "selectTaxon", "copyTaxon"]),
        ...mapActions(useDatasetStore, [
            "addTaxon", "removeTaxon", "addTaxonPicture", "setTaxon", "setTaxonPicture", "removeTaxonPicture",
            "characterWithId", "taxonWithId",
            "changeTaxonParent", "moveTaxonDown", "moveTaxonUp", "setTaxonLocations", "setTaxonState",
            "createTexExporter", "taxonDescriptions", "taxonParentChain", "taxonCharactersTree",
        ]),
        columnName(col: string): string {
            return columnNames[col];
        },
        getGeoMap(ch: DiscreteCharacter): GeoMap|undefined {
            return getCharacterMap(ch);
        },
        exportCSV() {
            let content = "NV,NS,Family,Biblio\n";
            const tree = this.taxonTree;
            const c = this.characterWithId("c277");
            if (!c || c.characterType !== "discrete") return;
            const states = new Set(c.states.map(s=>s.id));
            function writeCSV(node: Taxon, level: number, family: string) {
                const f = level === 1 ? node.name.S : family;
                if (level > 0) {
                    const biblios = node.states.filter(s=>states.has(s.id)).map(s=>s.name.S);
                    content += `${escape(node.name.V)}, ${escape(node.name.S + " " + node.author)},${escape(f)},${escape(biblios.join(", "))}\n`;
                }
                for (const child of node.children) {
                    writeCSV(child, level + 1, f);
                }
            }
            writeCSV(tree, 0, "");
            download(content, "csv", "summary");
        },
        zoomColumn(col: string) {
            this.selectedColumns = ["menu", col];
        },
        addColumn(col: string) {
            this.selectedColumns = [...this.selectedColumns, col];
        },
        removeColumn(col: string) {
            if (col !== 'menu') {
                const columnsExceptMenu = this.selectedColumns.filter(col => col !== 'menu');
                if (columnsExceptMenu.length === 1) { return; }
            }
            this.selectedColumns = this.selectedColumns.filter(c => c != col);
        },
        pushStateToChildren(state: State) {
            if (typeof this.selectedTaxon === "undefined") return;
            forEachHierarchy(this.selectedTaxon, child => {
                this.setTaxonState({ taxon: child, state, has: true });
            });
        },
        async importKml(e: Event) {
            if (!(e.target instanceof HTMLInputElement) || !this.selectedTaxon) return;
            
            const positions = await importKml((e.target.files ?? [])[0]);

            this.setTaxonLocations({ taxon: this.selectedTaxon, positions });
        },
        copyItem() {
            if (this.selectedTaxon) {
                this.copyTaxon(this.selectedTaxon);
            }
        },
        pasteItem() {
            this.pasteTaxon(this.selectedTaxonId);
        },
        moveUp(item: Taxon) {
            this.moveTaxonUp(item);
        },
        moveDown(item: Taxon) {
            this.moveTaxonDown(item);
        },
        openSelectParentDropdown() {
            this.selectingParent = true;
        },
        closeSelectParentDropdown() {
            this.selectingParent = false;
        },
        changeSelectedTaxonParent(id: string) {
            if (this.selectedTaxon) {
                this.changeTaxonParent({ taxon: this.selectedTaxon, newParentId: id });
            }
            this.selectingParent = false;
        },
        addTaxonHandler(e: {value: string[], parentId: string }) {
            const [name, vernacularName, nameCN] = e.value;
            this.addTaxon(createTaxon({
                ...createHierarchicalItem({ id: "", name: { S: name, V: vernacularName, CN: nameCN}, detail: "", pictures: [], }),
                bookInfoByIds: Object.fromEntries(this.books.map((book: Book) => [book.id, { fasc: "", page: undefined, detail: "" }])),
                parentId: e.parentId
            }));
        },
        removeTaxonHandler(e: { itemId: string }) {
            const taxonToRemove = this.taxonWithId(e.itemId);
            if (taxonToRemove) {
                this.removeTaxon(taxonToRemove);
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
                this.setTaxonState({ taxon: this.selectedTaxon, state: stateToAdd, has: selected });
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
            this.addTaxonPicture({ taxon: this.selectedTaxon, picture: normalizePicture({ id: `${this.selectedTaxon.id}-${numberOfPhotos}`, url: e.detail.value, label: e.detail.value, hubUrl: undefined }) });
        },
        setItemPhoto(e: {detail: {index: number, src: string, hubUrl: string}}) {
            if (!this.selectedTaxon) { return; }

            this.setTaxonPicture({
                taxon: this.selectedTaxon,
                index: e.detail.index,
                picture: normalizePicture({ ...this.selectedTaxon!.pictures[e.detail.index], url: e.detail.src, hubUrl: e.detail.hubUrl }),
            });
        },
        deleteItemPhoto(e: {detail: { index: number }}) {
            if (!this.selectedTaxon) { return; }

            this.removeTaxonPicture({ taxon: this.selectedTaxon, index: e.detail.index });
        },
        openPhoto(_: Event & {detail: { index: number }}) {
            this.bigImages = this.selectedTaxon!.pictures;
            this.showBigImage = true;
        },
        async emptyZip() {
            const zipTxt = await exportZipFolder(this.selectedTaxon ?? this.taxonsHierarchy!);
            download(zipTxt, "zip", undefined, true);
        },
        texExport() {
            const taxonToTex = this.createTexExporter();
            taxonToTex.onProgress((current, max) =>  { this.latexProgressText = " [" + current + " / " + max + "]" });
            taxonToTex.export().then(tex => {
                download(tex, "zip", undefined, true);
            });
        },
    }
};
</script>