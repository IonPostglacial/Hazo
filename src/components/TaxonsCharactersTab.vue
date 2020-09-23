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
        isStateChecked(stateId: string) {
            const selectedItemDescriptorStates = this.selectedItem?.descriptions.find((d: Description) => d.descriptor.id === this.selectedItemDescriptorId)?.states ?? [];
            return selectedItemDescriptorStates.map((s: State) => s.id).includes(stateId)
        },
        openPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            const selectedItemDescriptorPhotos = this.characters.getItemById(this.selectedItemDescriptorId)?.photos ?? [];
            this.$emit("open-photo", {index: e.detail.index, photos: selectedItemDescriptorPhotos });
        },
        addItemState({ selected, item }: { selected: boolean, item: State }) {
            console.log("add taxon state");
            if (!this.selectedItem || !this.selectedItem.descriptions) {
                console.warn("Cannot add item states : no item selected.");
                return;
            }
            let selectedDescription = this.selectedItem.descriptions.find((d: Description) => d.descriptor.id === item.descriptorId);
            console.log(selectedDescription?.states);
            if (typeof selectedDescription === "undefined") {
                selectedDescription = { descriptor: Object.assign({}, this.characters.getItemById(item.descriptorId)), states: [] };
                this.selectedItem.descriptions.push(selectedDescription);
            }
            const stateIndex = selectedDescription.states.findIndex((s: State) => s.id === item.id);

            if (selected) {
                if (stateIndex < 0) {
                    selectedDescription.states.push(item);
                }
            } else {
                if (stateIndex >= 0) {
                    selectedDescription.states.splice(stateIndex, 1);
                }
            }
            console.log(selectedDescription?.states);
            this.taxonsHierarchy.setItem(this.selectedItem);
        },
    }
});
</script>

<style>

</style>