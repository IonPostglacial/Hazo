<template>
    <div class="horizontal-flexbox start-align flex-grow-1">
        <nav v-if="showLeftMenu" class="scroll medium-margin thin-border white-background">
            <TreeMenu :items="items" name="item" v-on:select-item="selectTaxon" :selected-item="selectedTaxon" :name-fields="['name', 'vernacularName', 'nameCN']">
            </TreeMenu>
        </nav>
        <section v-if="typeof selectedItem !== 'undefined'" class="vertical-flexbox flex-grow-1">
            <div class="horizontal-flexbox flex-grow-1 scroll">
                <section class="vertical-flexbox flex-grow-1">
                    <div class="horizontal-flexbox scroll">
                        <TaxonsPanel :item="selectedItem" :descriptions="descriptions" @open-photo="openPhoto" @taxon-state-selected="addItemState" 
                            :extra-fields="extraFields" :books="books">
                        </TaxonsPanel>
                    </div>
                </section>
            </div>
        </section>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import TreeMenu from "./TreeMenu.vue";
import TaxonsPanel from "./TaxonsPanel.vue";
import type { Book } from "../bunga/Book"; // eslint-disable-line no-unused-vars
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars
import { Character, Field, State, Taxon } from "../bunga"; // eslint-disable-line no-unused-vars

interface Description { descriptor: Character, states: State[] }

export default Vue.extend({
    name: "TaxonsDescriptorsTab",
    components: { TreeMenu, TaxonsPanel },
    props: {
        showLeftMenu: Boolean,
        descriptions: Object as PropValidator<Record<string, Character>>,
        initItems: Object as PropValidator<Record<string, Taxon>>,
        extraFields: Array as PropValidator<Field[]>,
        taxonNameField: String,
        selectedTaxon: String,
        books: Array as PropValidator<Book[]>,
    },
    data() {
        return {
            items: this.initItems,
            selectedItemDescriptorId: "",
            itemDescriptorSearch: "",
            selectedItemDescriptorTree: {} as Record<string, Character>
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
        selectedItem(): Taxon {
            return this.items[this.selectedTaxon];
        },
        selectedItemDescriptorPhotos(): string[] {
            return this.descriptions[this.selectedItemDescriptorId].photos;
        },
        selectedItemDescriptorStates(): State[] {
            return this.selectedItem.descriptions.find((d: Description) => d.descriptor.id === this.selectedItemDescriptorId)?.states ?? [];
        },
        selectedItemDescriptorFilteredStates(): State[] {
            return this.descriptions[this.selectedItemDescriptorId]?.states?.filter(s => s.name.toUpperCase().startsWith(this.itemDescriptorSearch.toUpperCase()));
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
            return this.selectedItemDescriptorStates.map((s: State) => s.id).includes(stateId)
        },
        openPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.selectedItemDescriptorPhotos });
        },
        onStateSelection() {
            if (typeof this.selectedItem === "undefined") return;

            const itemStatesIds: string[] = [];
            const selectedItemIdDescriptions = this.selectedItem.descriptions ?? [];
            const dependencyTree: Record<string, Character> = {};
            for (const description of selectedItemIdDescriptions) {
                for (const state of description?.states ?? []) {
                    itemStatesIds.push(state.id);
                }
            }
            for (const descriptor of Object.values(this.descriptions)) {
                dependencyTree[descriptor.id] = Object.assign({}, descriptor);
                descriptor.hidden = descriptor.inapplicableStates.some(s => itemStatesIds.findIndex(id => id === s.id) >= 0 );
            }
            this.selectedItemDescriptorTree = {};
            this.selectedItemDescriptorTree = dependencyTree;
        },
        addItemState({ selected, item }: { selected: boolean, item: State }) {
            let selectedDescription = this.selectedItem.descriptions.find((d: Description) => d.descriptor.id === this.selectedItemDescriptorId);
            if (typeof selectedDescription === "undefined") {
                selectedDescription = { descriptor: Object.assign({}, this.descriptions[this.selectedItemDescriptorId]), states: [] };
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
            this.items[this.selectedItem.id] = Object.assign({}, this.selectedItem);
            this.onStateSelection();
        },
    }
});
</script>

<style>

</style>