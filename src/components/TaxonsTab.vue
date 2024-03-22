<template>
    <SplitPanel panel-id="taxon-menu-panel" class="horizontal-flexbox start-align flex-grow-1 no-vertical-overflow">
        <TreeMenu v-if="selectedColumns.includes('menu')" class="scroll white-background no-print" :editable="true" :items="taxonsToDisplay" :selected-item="selectedTaxon ? selectedTaxon.id : ''" 
            :name-store="nameStore"
            :name-fields="nameFields"
            @closed="removeColumn('menu')"
            @move-item-up="moveTaxonUp" @move-item-down="moveTaxonDown"
            @add-item="addTaxonHandler" @unselected="unselectTaxon" @delete-item="removeTaxon" v-slot="menuProps">
            <RouterLink class="flex-grow-1 nowrap unstyled-anchor" :to="'/taxons/' + menuProps.item.id">{{ menuProps.item.name }}</RouterLink>
        </TreeMenu>
        <HBox class="scroll flex-grow-1">
            <PopupGalery :title="selectedTaxon?.name.S" :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></PopupGalery>
            <ExtraFieldsPanel :showFields="showFields" :extraFields="extraFields" @closed="showFields = false"></ExtraFieldsPanel>
            <VBox class="flex-grow-1">
                <HBox class="no-print medium-padding thin-border">
                    <div class="button-group">
                        <button v-for="col in minimizedColumns" @click="addColumn(col)">
                            {{ columnName(col) }}
                        </button>
                    </div>
                    <HBox>
                        <RouterLink class="button" :to="'/print-taxons/' + selectedTaxonId" title="print">
                            <font-awesome-icon icon="fa-solid fa-print" />
                        </RouterLink>
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
                                <TreeMenu :items="taxonsToDisplay"
                                    :name-fields="nameFields"
                                    @closed="closeSelectParentDropdown" @select-item="changeSelectedTaxonParent" v-slot="menuProps">
                                    <div>{{ menuProps.item.name }}</div>
                                </TreeMenu>
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
                            <RouterLink class="button" to="/taxons-stats">Stats</RouterLink>
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
                <SplitPanel v-if="selectedTaxon && taxonValue" class="flex-grow-1 horizontal-flexbox scroll" panel-id="taxon-content-panel">
                    <VBox v-if="selectedColumns.includes('props')" :class="['scroll', { 'flex-grow-1': selectedColumns.length == 2 }]">
                        <ColumnHeader class="stick-to-top" label="Properties"
                            @minimize="removeColumn('props')"
                            @maximize="zoomColumn('props')"></ColumnHeader>
                        <PictureBox
                            @open-photo="openPhoto"
                            @add-photo="addItemPhoto"
                            @set-photo="setItemPhoto"
                            @delete-photo="deleteItemPhoto"
                            :pictures="selectedTaxon.pictures">
                        </PictureBox>
                        <CollapsiblePanel label="Properties">
                            <div class="scroll large-max-width form-grid center-items medium-padding">
                                <div class="display-contents">
                                    <label>NS</label>
                                    <input class="italic" type="text" lang="lat" spellcheck="false" v-model="taxonValue.name.S" />
                                    <label>Author</label>
                                    <input type="text" v-model="taxonValue.author" />
                                </div>
                                <ItemPropertyField v-model="taxonValue.name2">
                                    Synonymous</ItemPropertyField>
                                <ItemPropertyField v-model="taxonValue.name.CN">
                                    中文名</ItemPropertyField>
                                <ItemPropertyField v-model="taxonValue.name.V">
                                    NV</ItemPropertyField>
                                <ItemPropertyField v-model="taxonValue.vernacularName2">
                                    NV 2</ItemPropertyField>
                                <ItemPropertyField v-model="taxonValue.website">
                                    Website</ItemPropertyField>

                                <label>Meaning</label>
                                <textarea v-model="taxonValue.meaning"></textarea>

                                <ItemPropertyField v-model="taxonValue.noHerbier">
                                    N° Herbier</ItemPropertyField>
                                <ItemPropertyField v-model="taxonValue.herbariumPicture">
                                    Herbarium Picture</ItemPropertyField>
                                <ItemPropertyField v-for="extraField in extraFields" :key="extraField.id"
                                        :icon="extraField.icon"
                                        :model-value="extraProperty(extraField)"
                                        @input="setExtraProperty">
                                    {{ extraField.label }}
                                </ItemPropertyField>
                            </div>
                        </CollapsiblePanel>
                        <CollapsiblePanel v-for="book in books" :key="book.id" :label="book.label">
                            <VBox class="medium-padding" v-if="taxonValue && taxonValue.bookInfoByIds">
                                <div class="form-grid center-items" v-if="taxonValue.bookInfoByIds[book.id]">
                                    <ItemPropertyField v-model="taxonValue.bookInfoByIds[book.id].fasc">
                                    Book</ItemPropertyField>
                                    <ItemPropertyField v-model="taxonValue.bookInfoByIds[book.id].page">
                                    Page</ItemPropertyField>
                                </div>
                                <TextEditor
                                    v-model="taxonValue.bookInfoByIds[book.id].detail">
                                </TextEditor>
                            </VBox>
                        </CollapsiblePanel>
                        <CollapsiblePanel label="Additional Text" id="item-detail">
                            <TextEditor v-model="selectedTaxon.detail"></TextEditor>
                        </CollapsiblePanel>
                    </VBox>
                    <VBox v-if="selectedColumns.includes('desc')" class="scroll flex-grow-1">
                        <ColumnHeader class="stick-to-top" label="Descriptors"
                            @minimize="removeColumn('desc')"
                            @maximize="zoomColumn('desc')">
                        </ColumnHeader>
                        <SquareTreeViewer
                            :name-fields="['S', 'EN', 'CN']" 
                            :rootItems="itemDescriptorTree"
                            :selected-items="selectedStateIds"
                            :measurements="selectedTaxon.measurements"
                            @item-selection-toggled="taxonStateToggle"
                            @character-selection-toggled="taxonCharacterToggle"
                            @measurement-updated="updateTaxonMeasurement({ taxon: selectedTaxon, ...$event })"
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
                        <div class="thin-border medium-padding medium-margin flex-grow-1">
                            <HBox class="white-background medium-margin medium-padding thin-border center-items">
                                <div class="inline-block medium-padding medium-margin"><i>{{ selectedTaxon.name.S }}</i> {{ selectedTaxon.author }}</div>
                                <Spacer></Spacer>
                                <MultiSelector :choices="charNameFields.map(field => field.label)" v-model="selectedSummaryLangIds">
                                </MultiSelector>
                            </HBox>
                            <VBox v-for="section in taxonDescriptionSections(selectedTaxon, ch => ch.characterType === 'range' || ch.preset !== 'flowering')" 
                                class="thin-border rounded white-background medium-padding spaced-vertical"
                                :style="section.character.color ? ('background-color:color-mix(in hsl, '+section.character.color+', transparent 75%)') : ''">
                                <ul class="big-margin-left">
                                    <li v-for="desc in section.descriptions" :key="desc.character.id" class="medium-padding rounded">
                                        {{ selectedSummaryLangProperties.map((prop: string) => desc.character.name[prop]).join(" / ") }}
                                        <div v-if="'states' in desc" class="display-contents">
                                            <GeoView
                                                v-if="desc.character.characterType === 'discrete' && desc.character.preset === 'map'"
                                                :geo-map="getGeoMap(desc.character)"
                                                :selected-features="desc.states.map(s => s.name.S)">
                                            </GeoView>
                                            <ul v-if="desc.states.length > 0 && !(desc.character.characterType === 'discrete' && desc.character.preset === 'flowering')" class="indented">
                                                <li v-for="state in desc.states" :key="state.id">
                                                    <div :style="state.color ? ('background-color:color-mix(in hsl, '+state.color+', white 50%)') : ''" class="inline-block medium-padding">
                                                        {{ selectedSummaryLangProperties.map((prop: string) => state.name[prop]).join(" / ") }}
                                                    </div>
                                                    <button @click="removeState(state)">
                                                        <font-awesome-icon icon="fa-solid fa-close" />
                                                    </button>
                                                    <button v-if="hasChildren" @click="pushStateToChildren(state)">Push to children</button>
                                                </li>
                                            </ul>
                                        </div>
                                        <MeasurementBox v-if="desc.character.characterType === 'range' && 'min' in desc" 
                                            :measurement="desc"
                                            :lang-properties="selectedSummaryLangProperties">
                                        </MeasurementBox>
                                    </li>
                                </ul>
                            </VBox>
                            <VBox v-if="calendarTracks.length > 0" class="rounded white-background medium-padding medium-margin thin-border">
                                <h2>Calendar</h2>
                                <ul>
                                    <li v-for="track in calendarTracks">
                                        <span :style="'color:' + track.color">{{ track.name }}</span>
                                    </li>
                                </ul>
                                <Flowering
                                    :model-value="calendarTracks"
                                    class="limited-width">
                                </Flowering>
                            </VBox>
                        </div>
                    </VBox>
                </SplitPanel>
            </VBox>
        </HBox>
    </SplitPanel>
</template>

<script lang="ts">
import SquareTreeViewer from "./SquareTreeViewer.vue";
import TreeMenu from "./toolkit/TreeMenu.vue";
import PopupGalery from "./PopupGalery.vue";
import TaxonPresentation from "./TaxonPresentation.vue";
import ExtraFieldsPanel from "./ExtraFieldsPanel.vue";
import MeasurementBox from "@/components/MeasurementBox.vue";
import SplitPanel from "./toolkit/SplitPanel.vue";
import ScaleComparator from "./ScaleComparator.vue";
import GeoView from "./GeoView.vue";
import PictureBox from "./PictureBox.vue";
import { GoogleMap, Marker } from "vue3-google-map";
import { Book, Character, Hierarchy, State, Taxon, taxonPropertiesEquals, getCharacterMap } from "@/datatypes"; // eslint-disable-line no-unused-vars
import CollapsiblePanel from "./toolkit/CollapsiblePanel.vue";
import TextEditor from "./toolkit/TextEditor.vue";
import DropDownButton from "./toolkit/DropDownButton.vue";
import MultiSelector from "./toolkit/MultiSelector.vue";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import Spacer from "./toolkit/Spacer.vue";
import ColumnHeader from "./toolkit/ColumnHeader.vue";
import ItemPropertyField from "./ItemPropertyField.vue";
import download from "@/tools/download";
import { exportZipFolder, importKml } from "@/features";
import { createTaxon, taxonHasState } from "@/datatypes/Taxon";
import { createHierarchicalItem } from "@/datatypes/HierarchicalItem";
import { normalizePicture } from "@/datatypes/picture";
import { forEachHierarchy } from "@/datatypes/hierarchy";
import { createCharacter } from "@/datatypes/Character";
import { DiscreteCharacter, Field, GeoMap, Picture, Item } from "@/datatypes/types";
import { escape } from "@/tools/parse-csv";
import { Language, familyNameStore } from "@/db-index";
import Flowering, { Track } from "./Flowering.vue";
import { mapActions, mapState, mapWritableState } from "pinia";
import { useHazoStore } from "@/stores/hazo";
import { useDatasetStore } from "@/stores/dataset";
import debounce from "@/tools/debounce";
import clone from "@/tools/clone";
import { pathToItem } from "@/datatypes/Dataset";
import makeid from "@/tools/makeid";
import { fromNormalizedValue } from "@/features/unit";


const columns = ["menu", "props", "desc", "summary"];
const columnNames: Record<string, string> = { 
    menu: "Menu", 
    props: "Properties",
    desc: "Descriptions", 
    summary: "Summary"
};

export default {
    name: "TaxonsTab",
    components: {
        CollapsiblePanel, DropDownButton, HBox, ItemPropertyField, PictureBox, Spacer, SquareTreeViewer, VBox,
        GeoView, GoogleMap, Marker,
        ExtraFieldsPanel, MeasurementBox, MultiSelector, PopupGalery, SplitPanel, TreeMenu, TaxonPresentation,
        ColumnHeader, TextEditor,
        Flowering,
        ScaleComparator
    },
    data() {
        const selectedCols = (""+localStorage.selectedTaxonColumns)
            .split(",")
            .filter(col => columns.includes(col));
        const selectedTaxonId = this.$route.params.id as string ?? "";
        const store = useDatasetStore();
        const taxon = store.taxonWithId(selectedTaxonId);
        const taxonNameFields: Array<{ label: string, propertyName: Language }> = [{ label: 'NS', propertyName: 'S' }, { label: 'NV', propertyName: 'V'}, { label: '中文名', propertyName: 'CN' }];
        const taxonValue = taxon ? createTaxon(taxon) : undefined;
        return {
            taxonValue,
            nameFields: taxonNameFields,
            nameStore: familyNameStore,
            showFields: false,
            showBigImage: false,
            showMap: false,
            bigImages: [{ id: "", url: "", label: "", hubUrl: "" }] as Picture[],
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
                this.taxonValue = clone(this.selectedTaxon);
            }
        },
        selectedColumns() {
            localStorage.selectedTaxonColumns = this.selectedColumns.join(",");
        },
        taxonValue: {
            handler: debounce(500, function (this: any) {
                if (this.selectedTaxon && !taxonPropertiesEquals(this.selectedTaxon, this.taxonValue)) {
                    this.setTaxon({ taxon: this.selectedTaxon, props: clone(this.taxonValue) });
                }
            }),
            deep: true,
        },
    },
    computed: {
        ...mapWritableState(useHazoStore, ["selectedSummaryLangIds", "selectedDescriptorId"]),
        ...mapState(useHazoStore, ["charNameFields", "selectedDescriptor", "selectedSummaryLangProperties", "statesAllowList", "statesDenyList", "taxonsToDisplay"]),
        ...mapState(useDatasetStore, ["allTaxons", "books", "charactersHierarchy", "extraFields"]),
        selectedStateIds(): string[] {
            return this.selectedTaxon?.states.map(s => s.id) ?? [];
        },
        minimizedColumns(): string[] {
            return columns.filter(col => !this.selectedColumns.includes(col));
        },
        leftMenuSize(): number {
            return this.selectedColumns.includes("menu") ? 25 : 0;
        },
        rightPaneSize(): number {
            return this.selectedColumns.includes("menu") ? 75 : 100;
        },
        selectedTaxon(): Taxon|undefined {
            return this.taxonWithId(this.selectedTaxonId);
        },
        specimenLocations(): { lat: number, lng: number }[] {
            return this.selectedTaxon?.specimenLocations ?? [];
        },
        itemDescriptorTree(): Hierarchy<Item> {
            if (typeof this.selectedTaxon !== "undefined") {
                return this.taxonCharactersTree(this.selectedTaxon, this.selectedDescriptor);
            } else {
                return createCharacter({ id: "c0", path: [], name: { S: '' }, detail: ""});
            }
        },
        calendarTracks(): Track[] {
            if (typeof this.selectedTaxon === "undefined") {
                return [];
            }
            return this.taxonCalendarTracks(this.selectedTaxon);
        },
        hasChildren(): boolean {
            return (this.selectedTaxon?.children.length ?? 0) > 0;
        }
    },
    methods: {
        ...mapActions(useHazoStore, ["pasteTaxon", "selectTaxon", "copyTaxon", "unselectTaxon"]),
        ...mapActions(useDatasetStore, [
            "addTaxon", "removeTaxon", "addTaxonPicture", "setTaxon", "setTaxonPicture", "removeTaxonPicture",
            "characterWithId", "taxonWithId", "taxonChildren", "taxonCalendarTracks",
            "changeTaxonParent", "moveTaxonDown", "moveTaxonUp", "setTaxonLocations", "setTaxonCharacter", "setTaxonState",
            "createTexExporter", "taxonDescriptions", "taxonDescriptionSections", "taxonParentChain", "taxonCharactersTree", "updateTaxonMeasurement",
        ]),
        fromNormalizedValue: fromNormalizedValue,
        columnName(col: string): string {
            return columnNames[col];
        },
        getGeoMap(ch: DiscreteCharacter): GeoMap|undefined {
            return getCharacterMap(ch);
        },
        exportCSV() {
            let content = "NV,NS,Family,Biblio\n";
            const tree = this.taxonsToDisplay;
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
        addTaxonHandler(e: {value: string[], metadata: any, path: string[] }) {
            const [name, vernacularName, nameCN] = e.value;
            const pictures: Picture[] = []
            if (e.metadata?.img) {
                pictures.push(normalizePicture({
                    id: `p-${makeid(16)}`,
                    path: [],
                    url: e.metadata.img,
                    label: `${name} #1`,
                    hubUrl: undefined,
                }));
            }
            this.addTaxon(createTaxon({
                ...createHierarchicalItem({ 
                    id: "",
                    path: e.path,
                    type: "taxon", 
                    name: { S: name, V: vernacularName, CN: nameCN}, 
                    detail: "", pictures,
                }),
                bookInfoByIds: Object.fromEntries(this.books.map((book: Book) => 
                    [book.id, { type: "bookinfo", id: "b-" + makeid(8), path: [], fasc: "", page: "", detail: "" }])),
            }));
        },
        setExtraProperty(e: { detail: { property: string, value: string } }) {
            this.selectedTaxon!.extra[e.detail.property] = e.detail.value;
        },
        taxonStateToggle(e: { item: State }) {
            const stateToAdd = e.item;
            if (typeof this.selectedTaxon !== "undefined" && typeof stateToAdd !== "undefined") {
                const selected = !taxonHasState(this.selectedTaxon, stateToAdd);
                this.setTaxonState({ taxon: this.selectedTaxon, state: stateToAdd, has: selected });
            }
        },
        taxonCharacterToggle(e: { character: Character }) {
            const character = e.character as Character;
            if(character.characterType !== "discrete") { return; }
            const stateToAdd = character.inherentState;
            if (typeof this.selectedTaxon !== "undefined") {
                const selected = typeof stateToAdd !== "undefined" && taxonHasState(this.selectedTaxon, stateToAdd);
                this.setTaxonCharacter({ taxon: this.selectedTaxon, character, has: !selected });
            }
        },
        removeState(state: State) {
            if (!this.selectedTaxon) { return; }
            this.setTaxonState({ taxon: this.selectedTaxon, state, has: false });
        },
        openCharacter(e: { item: DiscreteCharacter }) {
            this.selectedDescriptorId = e.item.id;
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
            this.addTaxonPicture({ taxon: this.selectedTaxon, picture: normalizePicture({ 
                id: `${this.selectedTaxon.id}-${numberOfPhotos}`,
                path: pathToItem(this.selectedTaxon),
                url: e.detail.value,
                label: e.detail.value,
                hubUrl: undefined,
            }) });
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
            const zipTxt = this.selectedTaxon ? 
                await exportZipFolder(this.taxonChildren(this.selectedTaxon)) :
                await exportZipFolder(this.allTaxons);
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