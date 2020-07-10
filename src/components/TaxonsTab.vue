<template>
    <div class="horizontal-flexbox start-align flex-grow-1 height-full">
        <nav v-if="showLeftMenu" class="scroll medium-margin thin-border white-background">
            <TreeMenu editable :items="items" name="item" v-model="selectedItemId"
                :name-fields="['name', 'vernacularName', 'nameCN']"
                v-on:add-item="addItem"
                v-on:delete-item="deleteItem">
            </TreeMenu>
        </nav>
        <TaxonsPanel editable
            :v-if="typeof selectedItem !== 'undefined'"
            :show-image-box="showImageBox"
            :extra-fields="extraFields"
            :item="selectedItem" :descriptions="descriptions"
            v-on:open-photo="openPhoto">
        </TaxonsPanel>
    </div>
</template>

<script>
import TreeMenu from "./TreeMenu.vue";
import TaxonsPanel from "./TaxonsPanel.vue";
import Vue from "../../node_modules/vue/dist/vue.esm.browser.js";

export default {
    name: "TaxonsTab",
    components: { TreeMenu, TaxonsPanel },
    props: {
        showLeftMenu: Boolean,
        showImageBox: Boolean,
        descriptions: Object,
        initItems: Object,
        extraFields: Array,
    },
    data() {
        return {
            items: this.initItems ?? {},
            selectedItemId: "",
        };
    },
    computed: {
        selectedItem() {
            return this.items[this.selectedItemId];
        }
    },
    methods: {
        addItem({ value, parentId }) {
            let newItemIdNum = Object.keys(this.items).length;
            do {
                newItemIdNum++
            } while(typeof this.items["myt-" + newItemIdNum] !== "undefined");
            const newItemId = "myt-" + newItemIdNum;
            const newItem = {
                hid: "mytn-" + newItemId, id: newItemId, name: value, photos: [],
                topLevel: typeof parentId === "undefined", parentId: parentId, children: {}, open: false, descriptions: []
            };
            this.items = { ...this.items, [newItemId]: newItem };
            if (typeof parentId !== "undefined") {
                this.items[parentId].children = { ...this.items[parentId].children, [newItemId]: newItem };
            }
        },
        deleteItem({ parentId, itemId }) {
            if (typeof parentId !== "undefined") {
                Vue.delete(this.items[parentId].children, itemId);
            }
            Vue.delete(this.items, itemId);
        },
        openPhoto(e) {
            this.$emit("open-photo", e);
        },
    }
}
</script>