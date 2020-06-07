<template>
    <section v-if="typeof item !== 'undefined'" class="vertical-flexbox flex-grow-1">
        <ImageBox v-if="showImageBox"
            class="scroll min-height-300"
            :photos="item.photos"
            :editable="editable"
            v-on:add-photo="addItemPhoto"
            v-on:set-photo="setItemPhoto"
            v-on:delete-photo="deleteItemPhoto"
            v-on:open-photo="openPhoto">
        </ImageBox>
        <div class="horizontal-flexbox start-align flex-grow-1 scroll">
            <div class="thin-border medium-margin white-background scroll flex-grow-1">
                <label class="item-property">Name</label>
                <input :readonly="!editable" type="text" v-model="item.name" /><br/>

                <label class="item-property">中文名</label>
                <input :readonly="!editable"  type="text" v-model="item.nameCN" /><br/>

                <label class="item-property">Vernacular Name</label>
                <input :readonly="!editable"  type="text" v-model="item.vernacularName" /><br/>

                <label class="item-property">Meaning</label>
                <textarea :readonly="!editable"  v-model="item.meaning"></textarea><br/>

                <label class="item-property">N° Herbier</label>
                <input :readonly="!editable"  type="text" v-model="item.noHerbier" /><br/>

                <label class="item-property">Herbarium Picture</label>
                <input :readonly="!editable"  type="text" v-model="item.herbariumPicture" /><br/>

                <fieldset>
                    <legend>Flore de Madagascar et Comores</legend>
                    <label class="item-property">Fasc</label>
                    <input :readonly="!editable"  type="text" v-model="item.fasc" /><br/>

                    <label class="item-property">Page</label>
                    <input :readonly="!editable"  type="text" v-model="item.page" /><br/>
                </fieldset>

                <label class="item-property">Detail</label>
                <textarea :readonly="!editable"  id="item-detail " v-model="item.detail"></textarea><br/>

                <label class="item-property">Description</label>
                <TreeMenu :items="itemDescriptorTree"
                    :buttons="editable ? [{ id: 'pushToChildren', for: 'state', label: 'Push' }] : []"
                    v-on:button-click="itemDescriptorsButtonClicked">
                </TreeMenu>
            </div>
        </div>
    </section>
</template>

<script>
import TreeMenu from "./TreeMenu.vue";
import ImageBox from "./ImageBox.vue";

export default {
    name: "TaxonsPanel",
    components: { TreeMenu, ImageBox },
    props: { item: Object, descriptions: Object, editable: Boolean, showImageBox: Boolean },
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