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
                        <TaxonsPanel :item="selectedItem" :descriptions="descriptions" v-on:open-photo="openPhoto" 
                            :show-image-box="showImageBox" :extra-fields="extraFields" :books="books">
                        </TaxonsPanel>
                        <div v-if="selectedTaxon !== ''" class="vertical-flexbox">
                            <ImageBox class="scroll min-height-200" v-if="showImageBox && selectedItemDescriptorId !== ''"
                                v-on:open-photo="openPhoto"
                                :photos="descriptions[selectedItemDescriptorId].photos"></ImageBox>
                            <TreeMenu class="thin-border medium-margin white-background scroll"
                                v-on:select-item="selectItemDescriptorId" :selected-item="selectedItemDescriptorId"   
                                :items="selectedItemDescriptorTree" name="item-description">
                            </TreeMenu>
                        </div>
                    </div>
                </section>
                <section v-if="selectedTaxon != ''" class="vertical-flexbox flex-grow-1">
                    <div class="thin-border medium-margin medium-padding white-background scroll">
                        <div class="horizontal-flexbox space-between" v-if="selectedItemDescriptorId !== 0">
                            <button class="background-color-ok" v-on:click="addAllItemStates">Check All</button>
                            <button class="background-color-ko" v-on:click="removeAllItemStates"> Uncheck All</button>
                        </div>
                        <label class="horizontal-flexbox" v-if="selectedItemDescriptorId !== 0"><div>&nbsp;</div>
                            <input class="flex-grow-1" placeholder="Filter" type="search" v-model="itemDescriptorSearch" name="search-item-descriptor" id="search-item-descriptor">
                        </label>
                        <ul class="no-list-style" v-if="selectedItemDescriptorId !== 0">
                            <li class="horizontal-flexbox" v-for="(state, stateIndex) in selectedItemDescriptorFilteredStates" :key="selectedItem.id + state.id">
                                <input v-on:change="addItemState($event, state)" type="checkbox" :name="'state-' + stateIndex" :id="'state-' + stateIndex"
                                    :checked="isStateChecked(state.id)">
                                <input class="flex-grow-1" type="text" v-model="state.name" />
                            </li>
                        </ul>
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
import ImageBox from "./ImageBox.vue";
import { PropValidator } from 'vue/types/options';   // eslint-disable-line no-unused-vars
import { bunga_Book as Book, bunga_Character as Character, bunga_Field as Field, bunga_State as State, bunga_Taxon as Taxon } from "../libs/SDD";   // eslint-disable-line no-unused-vars

interface Description { descriptor: Character, states: State[] }

export default Vue.extend({
    name: "TaxonsDescriptorsTab",
    components: { TreeMenu, TaxonsPanel, ImageBox },
    props: {
        showLeftMenu: Boolean,
        showImageBox: Boolean,
        descriptions: Object as PropValidator<Record<string, Character>>,
        initItems: Object as PropValidator<Record<string, Taxon>>,
        extraFields: Array as PropValidator<Field[]>,
        taxonNameField: String,
        selectedTaxon: String,
        books:Array as PropValidator<Book[]>,
    },
    data() {
        return {
            items: this.initItems,
            selectedItemDescriptorId: "",
            itemDescriptorSearch: "",
        };
    },
    computed: {
        selectedItem(): Taxon {
            return this.items[this.selectedTaxon];
        },
        selectedItemDescriptorStates(): State[] {
            return this.selectedItem.descriptions.find((d: Description) => d.descriptor.id === this.selectedItemDescriptorId)?.states ?? [];
        },
        selectedItemDescriptorFilteredStates(): State[] {
            return this.descriptions[this.selectedItemDescriptorId]?.states?.filter(s => s.name.toUpperCase().startsWith(this.itemDescriptorSearch.toUpperCase()));
        },
        selectedItemDescriptorTree() {
            const itemStatesIds: string[] = [];
            const selectedItemIdDescriptions = this.selectedItem.descriptions ?? [];
            const dependencyTree: Record<string, Character> = JSON.parse(JSON.stringify(this.descriptions));
            for (const description of selectedItemIdDescriptions) {
                for (const state of description?.states ?? []) {
                    itemStatesIds.push(state.id);
                }
            }
            for (const descriptor of Object.values(dependencyTree)) {
                if (descriptor.inapplicableStates.some(s => itemStatesIds.findIndex(id => id === s.id) >= 0 )) {
                    descriptor.hidden = true;
                }
            }
            return dependencyTree;
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
        openPhoto(e: { photos: string[], index: number }) {
            this.$emit("open-photo", e);
        },
        addAllItemStates() {
            let selectedDescription = this.selectedItem.descriptions.find((d: Description) => d.descriptor.id === this.selectedItemDescriptorId);
            if (typeof selectedDescription === "undefined") {
                selectedDescription = { descriptor: Object.assign({}, this.descriptions[this.selectedItemDescriptorId]), states: [] };
                this.selectedItem.descriptions.push(selectedDescription);
            }
            selectedDescription.states = [...this.descriptions[this.selectedItemDescriptorId].states];
        },
        removeAllItemStates() {
            const selectedDescription = this.selectedItem.descriptions.find((d: Description) => d.descriptor.id === this.selectedItemDescriptorId);
            if (selectedDescription) {
                selectedDescription.states = [];
            }
        },
        addItemState(e: InputEvent, state: State) {
            let selectedDescription = this.selectedItem.descriptions.find((d: Description) => d.descriptor.id === this.selectedItemDescriptorId);
            if (typeof selectedDescription === "undefined") {
                selectedDescription = { descriptor: Object.assign({}, this.descriptions[this.selectedItemDescriptorId]), states: [] };
                this.selectedItem.descriptions.push(selectedDescription);
            }
            const stateIndex = selectedDescription.states.findIndex((s: State) => s.id === state.id);

            if (e.target instanceof HTMLInputElement && e.target.checked) {
                if (stateIndex < 0) {
                    selectedDescription.states.push(state);
                }
            } else {
                if (stateIndex >= 0) {
                    selectedDescription.states.splice(stateIndex, 1);
                }
            }
            this.items[this.selectedItem.id] = Object.assign({}, this.selectedItem);
        },
    }
});
</script>

<style>

</style>