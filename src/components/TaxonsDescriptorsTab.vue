<template>
    <TaxonsPanel :showLeftMenu="showLeftMenu" :item="selectedItem" :items="items" :descriptions="descriptions" @open-photo="openPhoto" @taxon-selected="selectTaxon" @taxon-state-selected="addItemState" 
        :extra-fields="extraFields" :books="books">
    </TaxonsPanel>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import TaxonsPanel from "./TaxonsPanel.vue";
import { Book, Character, Field, Hierarchy, State, Taxon } from "../bunga"; // eslint-disable-line no-unused-vars
import { ObservableMap } from '@/observablemap';

interface Description { descriptor: Character, states: State[] }

export default Vue.extend({
    name: "TaxonsDescriptorsTab",
    components: { TaxonsPanel },
    props: {
        showLeftMenu: Boolean,
        descriptions: Object as PropType<Hierarchy<Character>>,
        initItems: Object as PropType<Hierarchy<Taxon>>,
        extraFields: Array as PropType<Field[]>,
        taxonNameField: String,
        selectedTaxon: String,
        books: Array as PropType<Book[]>,
    },
    data() {
        return {
            items: this.initItems,
            selectedItemDescriptorId: "",
            itemDescriptorSearch: "",
            selectedItemDescriptorTree: {} as Hierarchy<Character>
        };
    },
    mounted() {
        this.onStateSelection();
    },
    watch: {
        selectedTaxon() {
            this.onStateSelection();
        }
    },
    computed: {
        selectedItem(): Taxon|undefined {
            return this.items.getItemById(this.selectedTaxon);
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
            const selectedItemDescriptorPhotos = this.descriptions.getItemById(this.selectedItemDescriptorId)?.photos ?? [];
            this.$emit("open-photo", {index: e.detail.index, photos: selectedItemDescriptorPhotos });
        },
        onStateSelection() {
            if (typeof this.selectedItem === "undefined") return;

            const itemStatesIds: string[] = [];
            const selectedItemIdDescriptions = this.selectedItem.descriptions ?? [];
            const dependencyTree = new Hierarchy<Character>("", new ObservableMap());
            for (const description of selectedItemIdDescriptions) {
                for (const state of description?.states ?? []) {
                    itemStatesIds.push(state.id);
                }
            }
            for (const descriptor of this.descriptions.allItems) {
                dependencyTree.setItem(Object.assign({}, descriptor));
                descriptor.hidden = descriptor.inapplicableStates.some(s => itemStatesIds.findIndex(id => id === s.id) >= 0 );
            }
            this.selectedItemDescriptorTree = dependencyTree;
        },
        addItemState({ selected, item }: { selected: boolean, item: State }) {
            if (!this.selectedItem || !this.selectedItem.descriptions) {
                console.warn("Cannot add item states : no item selected.");
                return;
            }

            let selectedDescription = this.selectedItem?.descriptions.find((d: Description) => d.descriptor.id === this.selectedItemDescriptorId);
            if (typeof selectedDescription === "undefined") {
                selectedDescription = { descriptor: Object.assign({}, this.descriptions.getItemById(this.selectedItemDescriptorId)), states: [] };
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
            this.items.setItem(Object.assign({}, this.selectedItem));
            this.onStateSelection();
        },
    }
});
</script>

<style>

</style>