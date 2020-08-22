<template>
    <section v-if="typeof item !== 'undefined'" :class="'flex-grow-1 ' + (editable ? 'horizontal-flexbox' : 'vertical-flexbox scroll')">
        <div :class="'vertical-flexbox' + (editable ? ' scroll' : '')">
            <ImageBox v-if="showImageBox"
                class="scroll min-height-300"
                :photos="item.photos"
                :editable="editable"
                v-on:add-photo="addItemPhoto"
                v-on:set-photo="setItemPhoto"
                v-on:delete-photo="deleteItemPhoto"
                v-on:open-photo="openPhoto">
            </ImageBox>
            <div :class="'horizontal-flexbox start-align flex-grow-1 ' + (editable ? '' : 'scroll')">
                <CollapsiblePanel label="Properties">
                    <label class="item-property">NS</label>
                    <div class="inline-block medium-padding medium-margin" v-if="!editable"><i>{{ item.name }}</i> {{ item.author }}</div><br/>
                    <div v-if="editable">
                        <input class="italic" type="text" lang="lat" spellcheck="false" v-model="item.name" /><br>
                        <label class="item-property">Author</label>
                        <input type="text" v-model="item.author" />
                    </div>

                    <TaxonPropertyField :editable="editable" :item="item" property="name2">Synonymous</TaxonPropertyField>
                    <TaxonPropertyField :editable="editable" :item="item" property="nameCN">中文名</TaxonPropertyField>
                    <TaxonPropertyField :editable="editable" :item="item" property="vernacularName">NV</TaxonPropertyField>
                    <TaxonPropertyField :editable="editable" :item="item" property="vernacularName2">NV 2</TaxonPropertyField>

                    <label class="item-property">Website</label>
                    <input v-if="editable" type="text" v-model="item.website" />
                    <a v-if="!editable" target="_blank" :href="item.website">{{ item.website }}</a><br/>

                    <label class="item-property">Meaning</label>
                    <textarea :readonly="!editable"  v-model="item.meaning"></textarea><br/>

                    <TaxonPropertyField :editable="editable" :item="item" property="noHerbier">N° Herbier</TaxonPropertyField>
                    <TaxonPropertyField :editable="editable" :item="item" property="herbariumPicture">Herbarium Picture</TaxonPropertyField>

                    <div v-for="extraField in extraFields" :key="extraField.id">
                        <TaxonPropertyField :editable="editable" :item="item.extra" :icon="extraField.icon" :property="extraField.id">{{ extraField.label }}</TaxonPropertyField>
                    </div>
                </CollapsiblePanel>
            </div>
        </div>
        <div :class="'vertical-flexbox ' + (editable ? 'scroll' : '')">
            <CollapsiblePanel v-for="book in books" :key="book.id" :label="book.label">
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
            </CollapsiblePanel>
            <ckeditor v-if="editable" :editor="editor" v-model="item.detail" :config="editorConfig"></ckeditor>
            <div v-if="!editable" id="item-detail" class="limited-width"  v-html="item.detail"></div><br/>

            <label class="item-property">Description</label>
            <TreeMenu :items="itemDescriptorTree"
                :buttons="editable ? [{ id: 'pushToChildren', for: 'state', label: 'Push' }] : []"
                v-on:button-click="itemDescriptorsButtonClicked">
            </TreeMenu>     
        </div>
    </section>
</template>

<script lang="ts">
import CollapsiblePanel from "./CollapsiblePanel.vue";
import TreeMenu from "./TreeMenu.vue";
import ImageBox from "./ImageBox.vue";
import TaxonPropertyField from "./TaxonPropertyField.vue";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Character, Taxon } from "../bunga"; // eslint-disable-line no-unused-vars
import Vue from "vue";
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "TaxonsPanel",
    components: { CollapsiblePanel, TreeMenu, ImageBox, ckeditor: CKEditor.component, TaxonPropertyField },
    props: { item: Object as PropValidator<Taxon>, descriptions: Object, editable: Boolean, showImageBox: Boolean, extraFields: Array, books:Array },
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
            const dependencyTree: Record<string, Character & { warning?: boolean }> = JSON.parse(JSON.stringify(this.descriptions));
            for (const description of selectedItemIdDescriptions) {
                for (const state of description?.states ?? []) {
                    itemStatesIds.push(state.id);
                }
            }
            for (const descriptor of Object.values(dependencyTree)) {
                const selectedDescription = selectedItemIdDescriptions.find(d => d.descriptor.id === descriptor.id);
                if (typeof selectedDescription === "undefined") continue;
                const descriptorStates = selectedDescription.states.map(s => Object.assign({ type: "state", parentId: s.descriptorId }, s));

                if (descriptor.inapplicableStates.some(s => itemStatesIds.findIndex(id => id === s.id) >= 0 )) {
                    descriptor.hidden = true;
                }

                if (descriptorStates.length === 0) {
                    descriptor.warning = true;
                    descriptor.children = {};
                }
                Object.assign(descriptor.children, descriptorStates);
            }
            return dependencyTree;
        },
    },
    methods: {
        itemDescriptorsButtonClicked({ buttonId, parentId, id }: { buttonId: string, parentId: string, id: string }) {
            if (buttonId === "pushToChildren") {
                const descriptor: Character = this.descriptions[parentId];
                const state = descriptor.states.find(s => s.id === id);

                for (const child of Object.values(this.item.children)) {
                    if (!(child instanceof Taxon)) continue;
                    const desc = child.descriptions.find(d => d.descriptor.id === descriptor.id);
                    if (desc && !desc.states.find(s => s.id === state?.id)) {
                        desc.states.push(Object.assign({}, state));
                    }
                }
            }
        },
        addItemPhoto(photo: string) {
            this.item.photos.push(photo);
        },
        setItemPhoto(index: number, photo: string) {
            this.item.photos[index] = photo;
        },
        deleteItemPhoto(index: number) {
            this.item.photos.splice(index, 1);
        },
        openPhoto(photo: { photos: string[], index: number }) {
            this.$emit("open-photo", photo);
        },
    }
});
</script>