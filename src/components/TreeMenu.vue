<template>
    <div class="vertical-flexbox">
        <div class="vertical-flexbox stick-to-top white-background thin-border">
            <div class="thin-margin horizontal-flexbox space-between">
                <input class="flex-grow-1" type="search" v-model="menuFilter" placeholder="Filter" />
                <div class="horizontal-flexbox">
                    <button type="button" v-on:click="openAll">Open All</button>
                    <button type="button" v-on:click="closeAll">Close All</button>
                </div>
            </div>
            <ul v-if="nameFields && nameFields.length > 1" class="thin-margin horizontal-flexbox space-between">
                <li class="flex-grow-1 no-list-style" v-for="(nameField, fieldNum) in nameFields" :key="nameField.propertyName">
                    <label :class="'full-width button ' + (visibleColumns[fieldNum] ? 'background-color-1' : '')">
                        <input type="checkbox" class="invisible" v-model="visibleColumns[fieldNum]">{{ nameField.label }}
                    </label>
                </li>
            </ul>
        </div>
        <div class="horizontal-flexbox">
            <ul v-for="(nameField, fieldNum) in (nameFields || ['name']).filter((e, i) => visibleColumns[i])" :key="nameField.propertyName"
                :class="'menu medium-padding ' + (fieldNum !== 0 ? 'thin-border-left' : '')">
                <TreeMenuItem v-for="item in itemsToDisplay" :key="item.id" :item-bus="itemsBus" :item="item"   
                    :show-ids="fieldNum === 0"
                    :space-for-add="editable && fieldNum > 0"
                    :editable="editable && fieldNum === 0" :buttons="buttons"
                    :name-field="nameField"
                    :selected-item="selectedItem"
                    :init-open="initOpen"
                    :init-open-items="initOpenItems"
                    @selected="selectItem"
                    @add-item="addItem"
                    @delete-item="deleteItem" 
                    @button-clicked="buttonClicked"
                    @move-item-up="moveItemUp"
                    @move-item-down="moveItemDown">
                </TreeMenuItem>
            </ul>
        </div>
         <add-item v-if="editable" v-on:add-item="addItem({ value: $event.detail })"></add-item>
    </div> 
</template>

<script lang="ts">
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { MenuEventHub } from "../menu-event-hub";
import TreeMenuItem from "./TreeMenuItem.vue";
import { HierarchicalItem } from "../bunga"; // eslint-disable-line no-unused-vars
import { Button } from "../Button"; // eslint-disable-line no-unused-vars
import { CombinedVueInstance } from 'vue/types/vue';  // eslint-disable-line no-unused-vars
import { Hierarchy } from '@/bunga/hierarchy';

export default Vue.extend({
    name: "TreeMenu",
    props: {
        items: Hierarchy as PropType<Hierarchy<HierarchicalItem<any>>>,
        buttons: Array as PropType<Button[]>,
        editable: Boolean,
        nameFields: Array as PropType<Array<{ label: string, propertyName: string }>>,
        selectedItem: String,
        initOpen: Boolean,
    },
    components:  { TreeMenuItem },
    data() {
        const initOpenItems: string[] = [];
        let itemId = this.items.getItemById(this.selectedItem)?.parentId;
        while (typeof itemId !== "undefined") {
            initOpenItems.push(itemId);
            itemId = this.items.getItemById(itemId)?.parentId;
        }
        return {
            menuFilter: "",
            itemsBus: new MenuEventHub(),
            visibleColumns: (this.nameFields ?? ["name"]).map(() => true),
            initOpenItems: initOpenItems,
        };
    },
    computed: {
        itemsToDisplay(): Iterable<HierarchicalItem<any>> {
            if (!this.items) return [];
            if (this.menuFilter !== "") {
                const self = this;
                return {
                    *[Symbol.iterator]() {
                        for (const item of self.items.allItems) {
                            if (self.nameFields.
                                    map(field => (item as any)[field.propertyName]).
                                    some(name => name?.toUpperCase().includes(self.menuFilter?.toUpperCase()) ?? false)) {
                                yield item;
                            }
                        }
                    }
                };
            } else {
                return this.items.topLevelItems;
            }
        },
    },
    methods: {
        selectItem(id: string) {
            this.$emit("select-item", id);
        },
        openAll() {
            this.itemsBus.emitOpenAll();
        },
        closeAll() {
            this.itemsBus.emitCloseAll();
        },
        addItem(e: string) {
            this.$emit("add-item", e);
        },
        deleteItem(e: string) {
            this.$emit("delete-item", e);
        },
        moveItemUp(item: HierarchicalItem<any>) {
            this.items.moveItemUp(item);
        },
        moveItemDown(item: HierarchicalItem<any>) {
            this.items.moveItemDown(item);
        },
        buttonClicked(e: string) {
            this.$emit("button-click", e);
        },
    }
});
</script>