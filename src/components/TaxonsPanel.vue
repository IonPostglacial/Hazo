<template>
    <section v-if="typeof item !== 'undefined'" :class="'flex-grow-1 ' + (editable ? 'horizontal-flexbox' : 'vertical-flexbox scroll')">
        <div :class="'vertical-flexbox' + (editable ? ' scroll' : '')">
            <ImageBox class="scroll min-height-300"
                :photos="item.photos"
                :editable="editable"
                v-on:add-photo="addItemPhoto"
                v-on:set-photo="setItemPhoto"
                v-on:delete-photo="deleteItemPhoto"
                v-on:open-photo="openPhoto">
            </ImageBox>
            <div :class="'horizontal-flexbox start-align flex-grow-1 ' + (editable ? '' : 'scroll')">
                <collapsible-panel label="Properties">
                    <label class="item-property">NS</label>
                    <div class="inline-block medium-padding medium-margin" v-if="!editable"><i>{{ item.name }}</i> {{ item.author }}</div><br/>
                    <div v-if="editable">
                        <input class="italic" type="text" lang="lat" spellcheck="false" v-model="item.name" /><br>
                        <label class="item-property">Author</label>
                        <input type="text" v-model="item.author" />
                    </div>
                    <item-property-field property="name2" :value="item.name2" :editable="editable"
                        v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">Synonymous</item-property-field>
                    <item-property-field property="nameCN" :value="item.nameCN" :editable="editable"
                        v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">中文名</item-property-field>
                    <item-property-field property="vernacularName" :value="item.vernacularName" :editable="editable"
                        v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">NV</item-property-field>
                    <item-property-field property="vernacularName2" :value="item.vernacularName2" :editable="editable"
                        v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">NV 2</item-property-field>

                    <label class="item-property">Website</label>
                    <input v-if="editable" type="text" v-model="item.website" />
                    <a v-if="!editable" target="_blank" :href="item.website">{{ item.website }}</a><br/>

                    <label class="item-property">Meaning</label>
                    <textarea :readonly="!editable"  v-model="item.meaning"></textarea><br/>

                    <item-property-field property="noHerbier" :value="item.noHerbier" :editable="editable"
                        v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">N° Herbier</item-property-field>
                    <item-property-field property="herbariumPicture" :value="item.herbariumPicture" :editable="editable"
                        v-on:set-property="setProperty" v-on:push-to-children="pushToChildren">Herbarium Picture</item-property-field>
                    <div v-for="extraField in extraFields" :key="extraField.id">
                        <item-property-field :property="extraField.id" :icon="extraField.icon" :value="item.extra[extraField.id]" :editable="editable"
                            v-on:set-property="setExtraProperty" v-on:push-to-children="pushToChildren">{{ extraField.label }}</item-property-field>
                    </div>
                </collapsible-panel>
            </div>
        </div>
        <div :class="'vertical-flexbox ' + (editable ? 'scroll' : '')">
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
            <ckeditor v-if="editable" :editor="editor" v-model="item.detail" :config="editorConfig"></ckeditor>
            <div v-if="!editable" id="item-detail" class="limited-width"  v-html="item.detail"></div><br/>

            <collapsible-panel label="Description">
                <TreeMenu :items="itemDescriptorTree"
                    :buttons="editable ? [{ id: 'pushToChildren', for: 'state', label: 'Push' }] : []"
                    v-on:button-click="itemDescriptorsButtonClicked">
                </TreeMenu>
            </collapsible-panel>
        </div>
    </section>
</template>

<script lang="ts">
import TreeMenu from "./TreeMenu.vue";
import ImageBox from "./ImageBox.vue";
//@ts-ignore
import CKEditor from '@ckeditor/ckeditor5-vue';
//@ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { Character, Taxon } from "../bunga"; // eslint-disable-line no-unused-vars
import Vue from "vue";
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "TaxonsPanel",
    components: { TreeMenu, ImageBox, ckeditor: CKEditor.component },
    props: { item: Object as PropValidator<Taxon>, descriptions: Object, editable: Boolean, extraFields: Array, books:Array },
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
                } else {
                    descriptor.name += ": " + descriptorStates.map(child => child.name).join(", ");
                }
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