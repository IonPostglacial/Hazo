<template>
    <div class="vertical-flexbox">
        <div class="vertical-flexbox stick-to-top white-background thin-border">
            <div class="thin-margin horizontal-flexbox space-between center-items">
                <input class="flex-grow-1" type="search" @input="updateSearchFilter" :value="visibleFilter" placeholder="Filter" />
                <div class="horizontal-flexbox button-group">
                    <button type="button" v-on:click="openAll">Open All</button>
                    <button type="button" v-on:click="closeAll">Close All</button>
                </div>
            </div>
            <ul v-if="nameFields && nameFields.length > 1" class="thin-margin horizontal-flexbox space-between button-group">
                <button @click="$emit('unselected')">0</button>
                <li v-for="nameField in nameFields" :key="nameField.propertyName" :class="['flex-grow-1', 'button', 'no-list-style', { 'background-color-1': visibleColumns[nameField.propertyName] }]" @click="toggleColumnVisibility(nameField.propertyName)">
                    {{ nameField.label }}
                </li>
            </ul>
        </div>
        <div class="horizontal-flexbox big-padding-right">
            <ul v-for="(nameField, fieldNum) in columnsToDisplay" :key="nameField.propertyName"
                :class="['menu', 'flex-grow-1', { 'thin-border-left': fieldNum !== 0 }]">
                <TreeMenuItem v-for="item in itemsToDisplay" :key="item.id" :item-bus="itemsBus"
                    :item="item" :items-hierarchy="items"   
                    :is-first-column="fieldNum === 0"
                    :is-last-column="fieldNum === columnsToDisplay.length - 1"
                    :space-for-add="editable && fieldNum > 0"
                    :editable="editable" :buttons="buttons"
                    :name-field="nameField"
                    :selected-item="selectedItem"
                    :init-open="initOpen"
                    :init-open-items="initOpenItems"
                    @selected="selectItem"
                    @add-item="addItem"
                    @delete-item="deleteItem" 
                    @button-clicked="buttonClicked"
                    @move-item-up="moveItemUp"
                    @move-item-down="moveItemDown" v-slot:default="menuItemProps">
                    <slot v-bind:item="menuItemProps.item"></slot>
                </TreeMenuItem>
            </ul>
        </div>
        <add-item v-if="editable" @add-item="addItem({ value: $event.detail })"></add-item>
    </div> 
</template>

<script lang="ts">
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { MenuEventHub } from "@/tools/menu-event-hub";
import TreeMenuItem from "./TreeMenuItem.vue";
import { Button, HierarchicalItem, Hierarchy } from "@/datatypes"; // eslint-disable-line no-unused-vars
import debounce from "@/tools/debounce";

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
        let itemId = this.items?.itemWithId(this.selectedItem)?.parentId;
        while (typeof itemId !== "undefined") {
            initOpenItems.push(itemId);
            itemId = this.items?.itemWithId(itemId)?.parentId;
        }
        return {
            menuFilter: "",
            visibleFilter: "",
            itemsBus: new MenuEventHub(),
            visibleColumns: Object.fromEntries(this.nameFields!.map((e) => [e.propertyName, true])),
            initOpenItems: initOpenItems,
        };
    },
    computed: {
        columnsToDisplay(): { label: string, propertyName: string }[] {
            return this.nameFields?.filter(nameField => this.visibleColumns[nameField.propertyName]) ?? [];
        },
        itemsToDisplay(): Iterable<HierarchicalItem<any>> {
            if (!this.items) return [];
            if (this.menuFilter !== "") {
                const self = this;
                return {
                    *[Symbol.iterator]() {
                        for (const item of self.items!.allItems) {
                            if (self.nameFields!.
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
        updateSearchFilterDebounced: debounce(500, function (this: any) {
            this.menuFilter = this.visibleFilter;
        }),
        updateSearchFilter(e: any) {
            this.visibleFilter = e.target.value;
            this.updateSearchFilterDebounced();
        },
        toggleColumnVisibility(propertName: string) {
            this.visibleColumns[propertName] = !this.visibleColumns[propertName];
        },
        selectItem(id: string) {
            this.$emit("select-item", id);
        },
        openAll() {
            this.itemsBus.emitOpenAll();
        },
        closeAll() {
            this.itemsBus.emitCloseAll();
        },
        addItem(e: { value: string[], parentId?: string }) {
            this.$emit("add-item", e);
        },
        deleteItem(e: string) {
            this.$emit("delete-item", e);
        },
        moveItemUp(item: HierarchicalItem<any>) {
            this.items?.moveUp(item);
        },
        moveItemDown(item: HierarchicalItem<any>) {
            this.items?.moveDown(item);
        },
        buttonClicked(e: string) {
            this.$emit("button-click", e);
        },
    }
});
</script>