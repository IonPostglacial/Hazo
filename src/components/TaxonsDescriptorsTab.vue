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
                        <TaxonsPanel :item="selectedItem" :descriptions="descriptions" v-on:open-photo="openPhoto" :show-image-box="showImageBox">
                        </TaxonsPanel>
                        <div v-if="selectedTaxon !== ''" class="vertical-flexbox">
                            <ImageBox class="scroll min-height-200" v-if="showImageBox && selectedItemDescriptorId !== 0"
                                v-on:open-photo="openPhoto"
                                :photos="descriptions[selectedItemDescriptorId].photos"></ImageBox>
                            <TreeMenu class="thin-border medium-margin white-background scroll"                                     
                                v-model="selectedItemDescriptorId"      
                                :items="descriptions" name="item-description">
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
                            <li class="horizontal-flexbox" v-for="(state, stateIndex) in selectedItemDescriptorFilteredStates" :key="state.id">
                                <input v-on:change="addItemState($event, state)" type="checkbox" :name="'state-' + stateIndex" :id="'state-' + stateIndex"
                                    :checked="selectedItemDescriptorStates.map(s => s.id).includes(state.id)">
                                <input class="flex-grow-1" type="text" v-model="state.name" />
                            </li>
                            <li class="">
                                <AddItem v-on:add-item="addState(descriptions[selectedItemDescriptorId], $event)"></AddItem>
                            </li>
                        </ul>
                    </div>
                </section>
            </div>
        </section>
    </div>
</template>

<script>
import TreeMenu from "./TreeMenu.vue";
import TaxonsPanel from "./TaxonsPanel.vue";
import ImageBox from "./ImageBox.vue";
import AddItem from "./AddItem.vue";

export default {
    name: "TaxonsDescriptorsTab",
    components: { TreeMenu, TaxonsPanel, ImageBox, AddItem },
    props: {
        showLeftMenu: Boolean,
        showImageBox: Boolean,
        descriptions: Object,
        initItems: Object,
        extraFields: Array,
        taxonNameField: String,
        selectedTaxon: String,
    },
    data() {
        return {
            items: this.initItems ?? {},
            selectedItemDescriptorId: 0,
            itemDescriptorSearch: "",
        };
    },
    computed: {
        selectedItem() {
            return this.items[this.selectedTaxon];
        },
        selectedItemDescriptorStates() {
            return this.selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptorId)?.states ?? [];
        },
        selectedItemDescriptorFilteredStates() {
            return this.descriptions[this.selectedItemDescriptorId]?.states?.filter(s => s.name.toUpperCase().startsWith(this.itemDescriptorSearch.toUpperCase()));
        },
        selectedItemDescriptorTree() {
            const itemStatesIds = [];
            const selectedItemIdDescriptions = this.selectedItem.descriptions ?? [];
            const dependencyTree = JSON.parse(JSON.stringify(this.descriptions));
            for (const description of selectedItemIdDescriptions) {
                for (const state of description?.states ?? []) {
                    itemStatesIds.push(state.id);
                }
            }
            for (const descriptor of Object.values(dependencyTree)) {
                const selectedDescription = selectedItemIdDescriptions.find(d => d.descriptor.id === descriptor.id);
                if (typeof selectedDescription === "undefined") continue;
                const descriptorStates = selectedDescription.states.map(s => Object.assign({ type: "state", parentId: s.descriptorId }, s));

                if (descriptor.inapplicableStates.some(s => itemStatesIds.findIndex(id => id === s.id) >= 0 )) {
                    descriptor.hidden = true;
                }

                if (descriptorStates.length === 0) {
                    descriptor.warning = true;
                    descriptor.children = {};
                }
                Object.assign(descriptor.children, descriptorStates);
            }
            return dependencyTree;
        },
    },
    methods: {
        selectTaxon(id) {
            this.$emit("taxon-selected", id);
        },
        openPhoto(e) {
            this.$emit("open-photo", e);
        },
        addAllItemStates() {
            const selectedDescription = this.selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptorId);
            if (typeof selectedDescription === "undefined") throw "Cannot add states if no description has been selected";
            selectedDescription.states = [...this.descriptions[selectedDescription.descriptor.id].states];
        },
        removeAllItemStates() {
            const selectedDescription = this.selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptorId);

            selectedDescription.states = [];
        },
        addItemState(e, state) {
            const selectedDescription = this.selectedItem.descriptions.find(d => d.descriptor.id === this.selectedItemDescriptorId);
            if (typeof selectedDescription === "undefined") throw "Cannot add a state when no description has been selected";
            const stateIndex = selectedDescription.states.findIndex(s => s.id === state.id);

            if (e.target.checked) {
                if (stateIndex < 0) {
                    selectedDescription.states.push(state);
                }
            } else {
                if (stateIndex >= 0) {
                    selectedDescription.states.splice(stateIndex, 1);
                }
            }
        },
    }
}
</script>

<style>

</style>