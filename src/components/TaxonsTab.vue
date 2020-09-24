<template>
    <TaxonsPanel editable
        :v-if="typeof selectedItem !== 'undefined'"
        :showLeftMenu="showLeftMenu"
        :extra-fields="extraFields" :books="books"
        :taxon="selectedItem" :taxonsHierarchy="taxonsHierarchy" :characters="characters"
        @add-taxon="addItem"
        @delete-taxon="deleteItem"
        @open-photo="openPhoto" @taxon-selected="selectTaxon">
    </TaxonsPanel>
</template>

<script lang="ts">
import TaxonsPanel from "./TaxonsPanel.vue";
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Book, Taxon } from "../bunga/datatypes"; // eslint-disable-line no-unused-vars
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars
import { Hierarchy } from '@/bunga/hierarchy';
import { createDetailData } from '@/bunga/DetailData';

export default Vue.extend({
    name: "TaxonsTab",
    components: { TaxonsPanel },
    props: {
        showLeftMenu: Boolean,
        characters: Object,
        initTaxons: Hierarchy as PropType<Hierarchy<Taxon>>,
        extraFields: Array,
        selectedTaxon: String,
        books: Array as PropType<Array<Book>>,
    },
    data() {
        return {
            taxonsHierarchy: this.initTaxons,
        };
    },
    computed: {
        selectedItem(): Taxon|undefined {
            return this.taxonsHierarchy.getItemById(this.selectedTaxon);
        }
    },
    methods: {
        selectTaxon(id: string) {
            this.$emit("taxon-selected", id);
        },
        addItem({ value, parentId } : {value: string, parentId: string }) {
            this.taxonsHierarchy.setItem({
                ...createDetailData({ id: "", name: value, photos: [], }),
                type: "taxon",
                hidden: false,
                childrenOrder: [],
                bookInfoByIds: Object.fromEntries(this.books.map((book: Book) => [book.id, { fasc: "", page: undefined, detail: "" }])),
                topLevel: typeof parentId === "undefined", parentId: parentId, children: {}, statesSelection: {}, extra: {}
            });
            this.$emit("change-taxons", this.taxonsHierarchy);
        },
        deleteItem({ itemId }: { itemId: string }) {
            const itemToDelete = this.taxonsHierarchy.getItemById(itemId);
            if (typeof itemToDelete !== "undefined") {
                this.taxonsHierarchy.removeItem(itemToDelete);
            } else {
                console.warn(`Trying to delete item with id ${itemId} which doesn't exist.`);
            }
        },
        openPhoto(e: { photos: string[], index: number }) {
            this.$emit("open-photo", e);
        },
    }
});
</script>