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
            <div :class="'horizontal-flexbox start-align flex-grow-1' + (editable ? '' : 'scroll')">
                <div class="thin-border medium-margin white-background scroll flex-grow-1">
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
                        <TaxonPropertyField :editable="editable" :item="item.extra" :property="extraField.id">{{ extraField.label }}</TaxonPropertyField>
                    </div>
                </div>
            </div>
        </div>
        <div :class="'thin-border medium-margin white-background flex-grow-1 vertical-flexbox ' + (editable ? 'scroll' : '')">
            <fieldset v-for="book in books" :key="book.id">
                <legend>{{ book.label }}</legend>
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
            </fieldset>
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

<script>
import TreeMenu from "./TreeMenu.vue";
import ImageBox from "./ImageBox.vue";
import TaxonPropertyField from "./TaxonPropertyField";
import CKEditor from '@ckeditor/ckeditor5-vue';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

export default {
    name: "TaxonsPanel",
    components: { TreeMenu, ImageBox, ckeditor: CKEditor.component, TaxonPropertyField },
    props: { item: Object, descriptions: Object, editable: Boolean, showImageBox: Boolean, extraFields: Array, books:Array },
    data() {
        return {
            editor: ClassicEditor,
            editorConfig: {}
        }
    },
    computed: {
        itemDescriptorTree() {
            const itemStatesIds = [];
            const selectedItemIdDescriptions = this.item.descriptions ?? [];
            const dependencyTree = JSON.parse(JSON.stringify(this.descriptions));
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
        itemDescriptorsButtonClicked({ buttonId, parentId, id }) {
            if (buttonId === "pushToChildren") {
                const descriptor = this.descriptions[parentId];
                const state = descriptor.states.find(s => s.id === id);

                for (const child of Object.values(this.item.children)) {
                    const desc = child.descriptions.find(d => d.descriptor.id === descriptor.id);
                    if (!desc.states.find(s => s.id === state.id)) {
                        desc.states.push(Object.assign({}, state));
                    }
                }
            }
        },
        addItemPhoto(photo) {
            this.item.photos.push(photo);
        },
        setItemPhoto(index, photo) {
            this.item.photos[index] = photo;
        },
        deleteItemPhoto(index) {
            this.item.photos.splice(index, 1);
        },
        openPhoto(photo) {
            this.$emit("open-photo", photo);
        },
    }
}
</script>