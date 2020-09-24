<template>
    <TaxonsPanel :showLeftMenu="showLeftMenu" :taxon="selectedItem" :taxonsHierarchy="taxonsHierarchy" :characters="characters"
        :extra-fields="extraFields" :books="books"
        @open-photo="openPhoto" @taxon-selected="selectTaxon" @taxon-state-selected="addItemState" >
    </TaxonsPanel>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import TaxonsPanel from "./TaxonsPanel.vue";
import { Book, Character, Field, Hierarchy, State, Taxon } from "../bunga"; // eslint-disable-line no-unused-vars
import clone from "../clone";

interface Description { descriptor: Character, states: State[] }

export default Vue.extend({
    name: "TaxonsCharactersTab",
    components: { TaxonsPanel },
    props: {
        showLeftMenu: Boolean,
        characters: Object as PropType<Hierarchy<Character>>,
        initTaxons: Object as PropType<Hierarchy<Taxon>>,
        extraFields: Array as PropType<Field[]>,
        taxonNameField: String,
        selectedTaxon: String,
        books: Array as PropType<Book[]>,
    },
    data() {
        return {
            taxonsHierarchy: this.initTaxons,
            selectedItemDescriptorId: "",
            itemDescriptorSearch: "",
        };
    },
    computed: {
        selectedItem(): Taxon|undefined {
            return this.taxonsHierarchy.getItemById(this.selectedTaxon);
        },
    },
    methods: {
        selectTaxon(id: string) {
            this.$emit("taxon-selected", id);
        },
        selectItemDescriptorId(id: string) {
            this.selectedItemDescriptorId = id;
        },
        isStateChecked(stateId: string): boolean {
            return this.selectedItem?.statesSelection[stateId] ?? false;
        },
        openPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            const selectedItemDescriptorPhotos = this.characters.getItemById(this.selectedItemDescriptorId)?.photos ?? [];
            this.$emit("open-photo", {index: e.detail.index, photos: selectedItemDescriptorPhotos });
        },
        addItemState({ selected, item }: { selected: boolean, item: State }) {
            if (typeof this.selectedItem !== "undefined") {
                this.selectedItem.statesSelection[item.id] = selected;
                this.taxonsHierarchy.setItem(clone(this.selectedItem));
            }
        },
    }
});
</script>

<style>

</style>