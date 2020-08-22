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

<script lang="ts">
import TreeMenu from "./TreeMenu.vue";
import TaxonsPanel from "./TaxonsPanel.vue";
import Vue from "vue";
import { Taxon } from "../bunga/Taxon"; // eslint-disable-line no-unused-vars
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars
import type { Book } from "../bunga/Book"; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "TaxonsTab",
    components: { TreeMenu, TaxonsPanel },
    props: {
        showLeftMenu: Boolean,
        showImageBox: Boolean,
        descriptions: Object,
        initItems: Object,
        extraFields: Array,
        selectedTaxon: String,
        books: Array as PropValidator<Array<Book>>,
    },
    data() {
        return {
            items: this.initItems ?? {},
        };
    },
    computed: {
        selectedItem(): Taxon {
            return this.items[this.selectedTaxon];
        }
    },
    methods: {
        selectTaxon(id: string) {
            this.$emit("taxon-selected", id);
        },
        addItem({ value, parentId } : {value: string, parentId: string }) {
            let newItemIdNum = Object.keys(this.items).length;
            do {
                newItemIdNum++
            } while(typeof this.items["myt-" + newItemIdNum] !== "undefined");
            const newItemId = "myt-" + newItemIdNum;
            const newItem = {
                hid: "mytn-" + newItemId, id: newItemId, name: value, photos: [],
                bookInfoByIds: Object.fromEntries(this.books.map((book: Book) => [book.id, { fasc: "", page: null, detail: "" }])),
                topLevel: typeof parentId === "undefined", parentId: parentId, children: {}, open: false, descriptions: [], extra: {}
            };
            this.items = { ...this.items, [newItemId]: newItem };
            if (typeof parentId !== "undefined") {
                this.items[parentId].children = { ...this.items[parentId].children, [newItemId]: newItem };
            }
            this.$emit("change-items", this.items);
        },
        deleteItem({ parentId, itemId }: { parentId :string, itemId: string }) {
            if (typeof parentId !== "undefined") {
                Vue.delete(this.items[parentId].children, itemId);
            }
            Vue.delete(this.items, itemId);
        },
        openPhoto(e: { photos: string[], index: number }) {
            this.$emit("open-photo", e);
        },
    }
});
</script>