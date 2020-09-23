<template>
    <div class="horizontal-flexbox start-align flex-grow-1">
        <nav v-if="showLeftMenu" class="scroll medium-margin thin-border white-background">
            <TreeMenu :editable="editable" :items="taxonsHierarchy" :selected-item="taxon ? taxon.id : ''" 
                :name-fields="[{ label: 'NS', propertyName: 'name' }, { label: 'NV', propertyName: 'vernacularName'}, { label: '中文名', propertyName: 'nameCN' }]"
                @select-item="selectTaxon" @add-item="addTaxon" @delete-item="deleteTaxon">
            </TreeMenu>
        </nav>
        <section v-if="typeof taxon !== 'undefined'" class="flex-grow-1 horizontal-flexbox">
            <div class="vertical-flexbox scroll">
                <picture-box :editable="editable"
                        @open-photo="openPhoto"
                        @add-photo="addItemPhoto"
                        @set-photo="setItemPhoto" 
                        @delete-photo="deleteItemPhoto">
                    <picture-frame v-for="(photo, index) in taxon.photos" :key="index"
                        :index="index" :editable="editable" :url="photo"></picture-frame>
                </picture-box>
                <div class="horizontal-flexbox start-align relative">
                    <collapsible-panel label="Properties" 
                            v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">
                        <div class="scroll large-max-width">
                            <label class="item-property">NS</label>
                            <div class="inline-block medium-padding medium-margin" v-if="!editable"><i>{{ taxon.name }}</i> {{ taxon.author }}</div><br/>
                            <div v-if="editable">
                                <input class="italic" type="text" lang="lat" spellcheck="false" v-model="taxon.name" /><br>
                                <label class="item-property">Author</label>
                                <input type="text" v-model="taxon.author" />
                            </div>
                            <item-property-field property="name2" :value="taxon.name2" :editable="editable">
                                Synonymous</item-property-field>
                            <item-property-field property="nameCN" :value="taxon.nameCN" :editable="editable">
                                中文名</item-property-field>
                            <item-property-field property="vernacularName" :value="taxon.vernacularName" :editable="editable">
                                NV</item-property-field>
                            <item-property-field property="vernacularName2" :value="taxon.vernacularName2" :editable="editable">
                                NV 2</item-property-field>

                            <label class="item-property">Website</label>
                            <input v-if="editable" type="text" v-model="taxon.website" />
                            <a v-if="!editable" target="_blank" :href="taxon.website">{{ taxon.website }}</a><br/>

                            <label class="item-property">Meaning</label>
                            <textarea :readonly="!editable"  v-model="taxon.meaning"></textarea><br/>

                            <item-property-field property="noHerbier" :value="taxon.noHerbier" :editable="editable">
                                N° Herbier</item-property-field>
                            <item-property-field property="herbariumPicture" :value="taxon.herbariumPicture" :editable="editable">
                                Herbarium Picture</item-property-field>
                            <div v-for="extraField in extraFields" :key="extraField.id">
                                <item-property-field :property="extraField.id" :icon="extraField.icon" :value="taxon.extra[extraField.id]" :editable="editable">
                                    {{ extraField.label }}</item-property-field>
                            </div>
                        </div>
                    </collapsible-panel>
                </div>
            </div>
            <div class="vertical-flexbox scroll flex-grow-1">
                <collapsible-panel v-for="book in books" :key="book.id" :label="book.label">
                    <div v-if="taxon.bookInfoByIds">
                        <div v-if="taxon.bookInfoByIds[book.id]">
                            <label class="medium-margin">
                                book:&nbsp;
                                <input v-if="editable" type="text" v-model="taxon.bookInfoByIds[book.id].fasc" />
                                <div class="inline-block medium-padding medium-margin" v-if="!editable">
                                    {{ taxon.bookInfoByIds[book.id].fasc }}
                                </div>
                            </label>
                            <label class="medium-margin">
                                page:&nbsp;
                                <input v-if="editable" type="text" v-model="taxon.bookInfoByIds[book.id].page" />
                                <div class="inline-block medium-padding medium-margin" v-if="!editable">
                                    {{ taxon.bookInfoByIds[book.id].page }}
                                </div>
                            </label>
                            <ckeditor v-if="editable" :editor="editor" v-model="taxon.bookInfoByIds[book.id].detail" :config="editorConfig"></ckeditor>
                            <div v-if="!editable" class="limited-width" v-html="taxon.bookInfoByIds[book.id].detail"></div><br/>
                        </div>
                    </div>
                </collapsible-panel>
                <collapsible-panel label="Additional Text" id="item-detail">
                    <ckeditor v-if="editable" :editor="editor" v-model="taxon.detail" :config="editorConfig"></ckeditor>
                    <div v-if="!editable" class="limited-width" v-html="taxon.detail"></div>
                </collapsible-panel>

                <collapsible-panel label="Description">
                    <SquareTreeViewer class="large-max-width" :editable="!editable" :rootItems="itemDescriptorTree" @item-selected="onItemStateSelected"></SquareTreeViewer>
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
import { Character, State, Taxon } from "../bunga"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Hierarchy } from '@/bunga/hierarchy';

export default Vue.extend({
    name: "TaxonsPanel",
    components: { SquareTreeViewer, ckeditor: CKEditor.component, TreeMenu },
    props: { taxon: Object as PropType<Taxon>, taxonsHierarchy: Hierarchy as PropType<Hierarchy<Character>>, characters: Hierarchy as PropType<Hierarchy<Character>>,
        showLeftMenu: Boolean, editable: Boolean, extraFields: Array, books:Array
    },
    data() {
        return {
            editor: ClassicEditor,
            editorConfig: {}
        }
    },
    computed: {
        itemDescriptorTree() {
            const itemStatesIds: string[] = [];
            const selectedItemIdDescriptions = this.taxon.descriptions ?? [];

            for (const description of selectedItemIdDescriptions) {
                for (const state of description?.states ?? []) {
                    itemStatesIds.push(state.id);
                }
            }
            const dependencyHierarchy: Hierarchy<Character & { warning?: boolean, selected?: boolean }> = this.characters.clone();
            const nonApplicableCharacters: Character[] = [];

            for (const descriptor of dependencyHierarchy.allItems) {
                const selectedDescription = selectedItemIdDescriptions.find(d => d.descriptor?.id === descriptor.id);
                const itemDescriptorStateIds = selectedDescription?.states.map(s => s.id) ?? [];
                const descriptorStates = descriptor.states.map(s => Object.assign({ type: "state", parentId: s.descriptorId, selected: itemStatesIds.includes(s.id) }, s));

                const taxonHasAllRequiredStates = descriptor.requiredStates.every(requiredState => itemStatesIds.includes(requiredState.id));
                const taxonHasSomeInapplicableState = descriptor.inapplicableStates.some(inapplicableState => itemStatesIds.includes(inapplicableState.id));

                if (!taxonHasAllRequiredStates || taxonHasSomeInapplicableState) {
                    nonApplicableCharacters.push(descriptor);
                    continue;
                }
                if (itemDescriptorStateIds.length === 0) {
                    descriptor.warning = true;
                }
                for (const state of descriptorStates) {
                    descriptor.childrenOrder.push(state.id);
                    descriptor.children[state.id] = state as unknown as Character;
                }
                dependencyHierarchy.setItem(descriptor);
            }
            for (const nonApplicableCharacter of nonApplicableCharacters) {
                dependencyHierarchy.removeItem(nonApplicableCharacter);
            }
            return dependencyHierarchy.allItems;
        },
    },
    methods: {
        selectTaxon(id: string) {
            this.$emit("taxon-selected", id);
        },
        addTaxon(e: {value: string, parentId: string }) {
            this.$emit("add-taxon", e);
        },
        deleteTaxon(e: { itemId: string }) {
            this.$emit("delete-taxon", e);
        },
        setProperty({ detail }: { detail: { property: string, value: string } }) {
            (this.taxon as any)[detail.property] = detail.value;
        },
        setExtraProperty({ detail }: { detail: { property: string, value: string } }) {
            this.taxon.extra[detail.property] = detail.value;
        },
        pushToChildren({ detail: property }: { detail: string }) {
            for (const child of Object.values(this.taxon.children)) {
                const anyChild: any = child, anyItem: any = this.taxon;
                anyChild[property] = anyItem[property];
            }
        },
        onItemStateSelected(e: { selected: boolean, item: State }) {
            this.$emit("taxon-state-selected", e);
        },
        addItemPhoto(e: {detail: { value: string }}) {
            this.taxon.photos.push(e.detail.value);
        },
        setItemPhoto(e: {detail: {index: number, value: string}}) {
            this.taxon.photos[e.detail.index] = e.detail.value;
        },
        deleteItemPhoto(e: {detail: { index: number }}) {
            this.taxon.photos.splice(e.detail.index, 1);
        },
        openPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.taxon.photos});
        },
    }
});
</script>