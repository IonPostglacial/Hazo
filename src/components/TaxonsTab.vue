<template>
    <div class="horizontal-flexbox start-align flex-grow-1 height-full">
        <nav v-if="showLeftMenu" class="scroll medium-margin thin-border white-background">
            <TreeMenu editable :items="items" name="item" v-on:select-item="selectTaxon" :selected-item="selectedTaxon"
                :name-fields="['name', 'vernacularName', 'nameCN']"
                v-on:add-item="addItem"
                v-on:delete-item="deleteItem">
            </TreeMenu>
        </nav>
        <TaxonsPanel editable
            :v-if="typeof selectedItem !== 'undefined'"
            :show-image-box="showImageBox"
            :extra-fields="extraFields" :books="books"
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
        selectedTaxon: String,
        books:Array,
    },
    data() {
        return {
            items: this.initItems ?? {},
        };
    },
    computed: {
        selectedItem() {
            return this.items[this.selectedTaxon];
        }
    },
    methods: {
        selectTaxon(id) {
            this.$emit("taxon-selected", id);
        },
        addItem({ value, parentId }) {
            let newItemIdNum = Object.keys(this.items).length;
            do {
                newItemIdNum++
            } while(typeof this.items["myt-" + newItemIdNum] !== "undefined");
            const newItemId = "myt-" + newItemIdNum;
            const newItem = {
                hid: "mytn-" + newItemId, id: newItemId, name: value, photos: [],
                bookInfoByIds: Object.fromEntries(this.books.map(book => [book.id, { fasc: "", page: null, detail: "" }])),
                topLevel: typeof parentId === "undefined", parentId: parentId, children: {}, open: false, descriptions: [], extra: {}
            };
            this.items = { ...this.items, [newItemId]: newItem };
            if (typeof parentId !== "undefined") {
                this.items[parentId].children = { ...this.items[parentId].children, [newItemId]: newItem };
            }
            this.$emit("change-items", this.items);
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