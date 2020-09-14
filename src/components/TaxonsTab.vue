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
import { Book, Taxon } from "../bunga/datatypes"; // eslint-disable-line no-unused-vars
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars
import { Hierarchy } from '@/bunga/hierarchy';
import { createDetailData } from '@/bunga/DetailData';

export default Vue.extend({
    name: "TaxonsTab",
    components: { TreeMenu, TaxonsPanel },
    props: {
        showLeftMenu: Boolean,
        descriptions: Object,
        initItems: Hierarchy as PropValidator<Hierarchy<Taxon>>,
        extraFields: Array,
        selectedTaxon: String,
        books: Array as PropValidator<Array<Book>>,
    },
    data() {
        return {
            items: this.initItems,
        };
    },
    computed: {
        selectedItem(): Taxon {
            return this.items.getItemById(this.selectedTaxon);
        }
    },
    methods: {
        selectTaxon(id: string) {
            this.$emit("taxon-selected", id);
        },
        addItem({ value, parentId } : {value: string, parentId: string }) {
            this.items.addItem({
                ...createDetailData({ id: "", name: value, photos: [], }),
                type: "taxon",
                hidden: false,
                childrenOrder: [],
                bookInfoByIds: Object.fromEntries(this.books.map((book: Book) => [book.id, { fasc: "", page: undefined, detail: "" }])),
                topLevel: typeof parentId === "undefined", parentId: parentId, children: {}, descriptions: [], extra: {}
            });
            this.$emit("change-items", this.items);
        },
        deleteItem({ itemId }: { itemId: string }) {
            this.items.removeItem(this.items.getItemById(itemId));
        },
        openPhoto(e: { photos: string[], index: number }) {
            this.$emit("open-photo", e);
        },
    }
});
</script>