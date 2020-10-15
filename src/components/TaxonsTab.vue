<template>
    <div class="horizontal-flexbox start-align flex-grow-1">
        <nav v-if="showLeftMenu" class="scroll thin-border white-background">
            <TreeMenu :editable="editable" :items="taxonsHierarchy" :selected-item="selectedTaxon ? selectedTaxon.id : ''" 
                :name-fields="[{ label: 'NS', propertyName: 'name' }, { label: 'NV', propertyName: 'vernacularName'}, { label: '中文名', propertyName: 'nameCN' }]"
                @select-item="selectTaxon" @add-item="addTaxon" @delete-item="removeTaxon">
            </TreeMenu>
        </nav>
        <section v-if="typeof selectedTaxon !== 'undefined'" class="flex-grow-1 horizontal-flexbox">
            <div class="vertical-flexbox scroll">
                <picture-box :editable="editable"
                        @open-photo="openPhoto"
                        @add-photo="addItemPhoto"
                        @set-photo="setItemPhoto" 
                        @delete-photo="deleteItemPhoto">
                    <picture-frame v-for="(photo, index) in selectedTaxon.photos" :key="photo.id"
                        :index="index" :editable="editable" :url="photoUrl(photo)"></picture-frame>
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
                            <div v-if="!editable" class="limited-width" v-html="selectedTaxon.bookInfoByIds[book.id].detail"></div><br/>
                        </div>
                    </div>
                </collapsible-panel>
                <collapsible-panel label="Additional Text" id="item-detail">
                    <ckeditor v-if="editable" :editor="editor" v-model="selectedTaxon.detail" :config="editorConfig"></ckeditor>
                    <div v-if="!editable" class="limited-width" v-html="selectedTaxon.detail"></div>
                </collapsible-panel>
                <collapsible-panel label="Description">
                    <SquareTreeViewer class="large-max-width" :editable="!editable" :rootItems="itemDescriptorTree" @item-selection-toggled="taxonStateToggle" @item-open="openCharacter"></SquareTreeViewer>
                </collapsible-panel>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import SquareTreeViewer from "./SquareTreeViewer.vue";
import TreeMenu from "./TreeMenu.vue";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Book, Character, Picture, State, Taxon } from "../bunga"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Hierarchy } from '@/bunga/hierarchy';
import clone from '@/clone';
import { createDetailData } from '@/bunga/DetailData';
import { createTaxon } from '@/bunga/Taxon';
import { pictureUrl } from '@/bunga/pictures';

export default Vue.extend({
    name: "TaxonsTab",
    components: { SquareTreeViewer, ckeditor: CKEditor.component, TreeMenu },
    props: {
        showLeftMenu: Boolean,
        characters: Hierarchy as PropType<Hierarchy<Character>>,
        taxonsHierarchy: Hierarchy as PropType<Hierarchy<Taxon>>,
        extraFields: Array,
        selectedTaxon: Object as PropType<Taxon>,
        editable: Boolean,
        books: Array as PropType<Array<Book>>,
    },
    data() {
        return {
            editor: ClassicEditor,
            editorConfig: {}
        }
    },
    computed: {
        itemDescriptorTree() {
            const dependencyHierarchy: Hierarchy<Character & { selected?: boolean }> = clone(this.characters);

            for (const character of dependencyHierarchy.allItems) {
                const taxonLacksRequiredStates = !character.requiredStates.every(requiredState => this.selectedTaxon.statesSelection[requiredState.id] ?? false);
                const taxonHasSomeInapplicableState = character.inapplicableStates.some(inapplicableState => this.selectedTaxon.statesSelection[inapplicableState.id] ?? false);

                if (taxonLacksRequiredStates || taxonHasSomeInapplicableState) {
                    dependencyHierarchy.remove(character);
                } else {
                    const characterStates = character.states.map(s => Object.assign({ type: "state", parentId: s.descriptorId, selected: this.selectedTaxon.statesSelection[s.id] ?? false }, s));
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
        photoUrl(photo: Picture) {
            return pictureUrl(photo);
        },
        selectTaxon(id: string) {
            this.$emit("taxon-selected", id);
        },
        addTaxon(e: {value: string, parentId: string }) {
            this.$emit("add-taxon", createTaxon({
                ...createDetailData({ id: "", name: e.value, photos: [], }),
                bookInfoByIds: Object.fromEntries(this.books.map((book: Book) => [book.id, { fasc: "", page: undefined, detail: "" }])),
                parentId: e.parentId, childrenIds: []
            }));
        },
        removeTaxon(e: { itemId: string }) {
            this.$emit("remove-taxon", this.taxonsHierarchy.itemWithId(e.itemId));
        },
        setProperty({ detail }: { detail: { property: string, value: string } }) {
            (this.selectedTaxon as any)[detail.property] = detail.value;
        },
        setExtraProperty({ detail }: { detail: { property: string, value: string } }) {
            this.selectedTaxon.extra[detail.property] = detail.value;
        },
        pushToChildren({ detail: property }: { detail: string }) {
            for (const child of this.taxonsHierarchy.childrenOf(this.selectedTaxon)) {
                const anyChild: any = child, anyItem: any = this.selectedTaxon;
                anyChild[property] = anyItem[property];
            }
        },
        taxonStateToggle(e: { item: State|Character }) {
            const isCharacter = (e.item as Character).type === "character";
            const stateToAddId = isCharacter ? (e.item as Character).inherentState?.id : e.item.id;

            if (typeof this.selectedTaxon !== "undefined" && typeof stateToAddId !== "undefined") {
                const selected = !this.selectedTaxon.statesSelection[stateToAddId];
                const newStateSelection = { ...this.selectedTaxon.statesSelection, [stateToAddId]: selected };
                this.$emit("add-taxon", { ...this.selectedTaxon, statesSelection: newStateSelection });
            }
        },
        openCharacter(e: { item: Character }) {
            if (typeof e.item.inherentState !== "undefined" && !this.selectedTaxon.statesSelection[e.item.inherentState.id]) {
                this.taxonStateToggle({ item: e.item.inherentState });
            }
        },
        addItemPhoto(e: {detail: { value: string }}) {
            const numberOfPhotos = this.selectedTaxon.photos.length;
            this.selectedTaxon.photos.push({ id: `${this.selectedTaxon.id}-${numberOfPhotos}`, url: e.detail.value, label: e.detail.value });
        },
        setItemPhoto(e: {detail: {index: number, value: string}}) {
            this.selectedTaxon.photos[e.detail.index].url = e.detail.value;
        },
        deleteItemPhoto(e: {detail: { index: number }}) {
            this.selectedTaxon.photos.splice(e.detail.index, 1);
        },
        openPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.selectedTaxon.photos});
        },
    }
});
</script>