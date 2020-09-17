<template>
    <section v-if="typeof item !== 'undefined'" class="flex-grow-1 horizontal-flexbox">
        <div class="vertical-flexbox scroll">
            <picture-box :editable="editable"
                    @open-photo="openPhoto"
                    @add-photo="addItemPhoto"
                    @set-photo="setItemPhoto" 
                    @delete-photo="deleteItemPhoto">
                <picture-frame v-for="(photo, index) in item.photos" :key="index"
                    :index="index" :editable="editable" :url="photo"></picture-frame>
            </picture-box>
            <div class="horizontal-flexbox start-align relative">
                <collapsible-panel label="Properties" 
                        v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">
                    <div class="scroll large-max-width">
                        <label class="item-property">NS</label>
                        <div class="inline-block medium-padding medium-margin" v-if="!editable"><i>{{ item.name }}</i> {{ item.author }}</div><br/>
                        <div v-if="editable">
                            <input class="italic" type="text" lang="lat" spellcheck="false" v-model="item.name" /><br>
                            <label class="item-property">Author</label>
                            <input type="text" v-model="item.author" />
                        </div>
                        <item-property-field property="name2" :value="item.name2" :editable="editable">
                            Synonymous</item-property-field>
                        <item-property-field property="nameCN" :value="item.nameCN" :editable="editable">
                            中文名</item-property-field>
                        <item-property-field property="vernacularName" :value="item.vernacularName" :editable="editable">
                            NV</item-property-field>
                        <item-property-field property="vernacularName2" :value="item.vernacularName2" :editable="editable">
                            NV 2</item-property-field>

                        <label class="item-property">Website</label>
                        <input v-if="editable" type="text" v-model="item.website" />
                        <a v-if="!editable" target="_blank" :href="item.website">{{ item.website }}</a><br/>

                        <label class="item-property">Meaning</label>
                        <textarea :readonly="!editable"  v-model="item.meaning"></textarea><br/>

                        <item-property-field property="noHerbier" :value="item.noHerbier" :editable="editable">
                            N° Herbier</item-property-field>
                        <item-property-field property="herbariumPicture" :value="item.herbariumPicture" :editable="editable">
                            Herbarium Picture</item-property-field>
                        <div v-for="extraField in extraFields" :key="extraField.id">
                            <item-property-field :property="extraField.id" :icon="extraField.icon" :value="item.extra[extraField.id]" :editable="editable">
                                {{ extraField.label }}</item-property-field>
                        </div>
                    </div>
                </collapsible-panel>
            </div>
        </div>
        <div class="vertical-flexbox scroll">
            <collapsible-panel v-for="book in books" :key="book.id" :label="book.label">
                <div v-if="item.bookInfoByIds">
                    <div v-if="item.bookInfoByIds[book.id]">
                        <label class="medium-margin">
                            book:&nbsp;
                            <input v-if="editable" type="text" v-model="item.bookInfoByIds[book.id].fasc" />
                            <div class="inline-block medium-padding medium-margin" v-if="!editable">
                                {{ item.bookInfoByIds[book.id].fasc }}
                            </div>
                        </label>
                        <label class="medium-margin">
                            page:&nbsp;
                            <input v-if="editable" type="text" v-model="item.bookInfoByIds[book.id].page" />
                            <div class="inline-block medium-padding medium-margin" v-if="!editable">
                                {{ item.bookInfoByIds[book.id].page }}
                            </div>
                        </label>
                        <ckeditor v-if="editable" :editor="editor" v-model="item.bookInfoByIds[book.id].detail" :config="editorConfig"></ckeditor>
                        <div v-if="!editable" class="limited-width" v-html="item.bookInfoByIds[book.id].detail"></div><br/>
                    </div>
                </div>
            </collapsible-panel>
            <collapsible-panel label="Additional Text" id="item-detail">
                <ckeditor v-if="editable" :editor="editor" v-model="item.detail" :config="editorConfig"></ckeditor>
                <div v-if="!editable" class="limited-width" v-html="item.detail"></div>
            </collapsible-panel>

            <collapsible-panel label="Description">
                <SquareTreeViewer class="large-max-width" :editable="!editable" :rootItems="itemDescriptorTree" @item-selected="onItemStateSelected"></SquareTreeViewer>
            </collapsible-panel>
        </div>
    </section>
</template>

<script lang="ts">
import SquareTreeViewer from "./SquareTreeViewer.vue";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Character, State, Taxon } from "../bunga"; // eslint-disable-line no-unused-vars
import Vue from "vue";
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars
import { Hierarchy } from '@/bunga/hierarchy';
import { ObservableMap } from '@/observablemap';

export default Vue.extend({
    name: "TaxonsPanel",
    components: { SquareTreeViewer, ckeditor: CKEditor.component },
    props: { item: Object as PropValidator<Taxon>, descriptions: Hierarchy as PropValidator<Hierarchy<Character>>, editable: Boolean, extraFields: Array, books:Array },
    data() {
        return {
            editor: ClassicEditor,
            editorConfig: {}
        }
    },
    computed: {
        itemDescriptorTree() {
            const itemStatesIds: string[] = [];
            const selectedItemIdDescriptions = this.item.descriptions ?? [];

            for (const description of selectedItemIdDescriptions) {
                for (const state of description?.states ?? []) {
                    itemStatesIds.push(state.id);
                }
            }
            const dependencyHierarchy = new Hierarchy<Character & { warning?: boolean, selected?: boolean }>("", new ObservableMap());
            for (const item of this.descriptions.allItems) {
                const descriptor = { ...item, warning: false };
                const selectedDescription = selectedItemIdDescriptions.find(d => d.descriptor.id === descriptor.id);
                if (typeof selectedDescription === "undefined") continue;
                const itemDescriptorStateIds = selectedDescription.states.map(s => s.id);
                const descriptorStates = descriptor.states.map(s => Object.assign({ type: "state", parentId: s.descriptorId, selected: itemDescriptorStateIds.includes(s.id) }, s));

                if (descriptor.inapplicableStates.some(s => itemStatesIds.findIndex(id => id === s.id) >= 0 )) {
                    descriptor.hidden = true;
                }
                if (itemDescriptorStateIds.length === 0) {
                    descriptor.warning = true;
                } else {
                    Object.assign(descriptor.children, descriptorStates);
                }
                dependencyHierarchy.setItem(descriptor);
            }
            return dependencyHierarchy.allItems;
        },
    },
    methods: {
        setProperty({ detail }: { detail: { property: string, value: string } }) {
            (this.item as any)[detail.property] = detail.value;
        },
        setExtraProperty({ detail }: { detail: { property: string, value: string } }) {
            this.item.extra[detail.property] = detail.value;
        },
        pushToChildren({ detail: property }: { detail: string }) {
            for (const child of Object.values(this.item.children)) {
                const anyChild: any = child, anyItem: any = this.item;
                anyChild[property] = anyItem[property];
            }
        },
        onItemStateSelected(e: { selected: boolean, item: State }) {
            this.$emit("taxon-state-selected", e);
        },
        addItemPhoto(e: {detail: { value: string }}) {
            this.item.photos.push(e.detail.value);
        },
        setItemPhoto(e: {detail: {index: number, value: string}}) {
            this.item.photos[e.detail.index] = e.detail.value;
        },
        deleteItemPhoto(e: {detail: { index: number }}) {
            this.item.photos.splice(e.detail.index, 1);
        },
        openPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.item.photos});
        },
    }
});
</script>