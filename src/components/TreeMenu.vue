<template>
    <div class="vertical-flexbox">
        <div class="vertical-flexbox stick-to-top white-background thin-border">
            <div class="thin-margin horizontal-flexbox space-between center-items">
                <input class="flex-grow-1" type="search" @input="updateSearchFilter" :value="visibleFilter" placeholder="Filter" />
                <div class="horizontal-flexbox button-group">
                    <button type="button" v-on:click="openAll">Expand</button>
                    <button type="button" v-on:click="closeAll">Collapse</button>
                </div>
            </div>
            <ul v-if="nameFields && nameFields.length > 1" class="thin-margin horizontal-flexbox space-between button-group">
                <button @click="$emit('unselected')">0</button>
                <li v-for="nameField in nameFields" :key="nameField.propertyName" :class="['flex-grow-1', 'button', 'no-list-style', { 'background-color-1': visibleColumns[nameField.propertyName] }]" @click="toggleColumnVisibility(nameField.propertyName)">
                    {{ nameField.label }}
                </li>
            </ul>
        </div>
        <ul :class="['menu', 'flex-grow-1', 'big-padding-right', 'tree-grid', 'tree-cols-' + columnsToDisplay.length, { editable: editable }]">
            <TreeMenuItem v-for="item in itemsToDisplay" :key="item.id" :item-bus="itemsBus"
                :item="item"
                :editable="editable" :buttons="buttons"
                :field-names="columnsToDisplay"
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
        <add-item v-if="editable" @add-item="addItem({ value: $event.detail })"></add-item>
    </div> 
</template>

<script lang="ts">
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { MenuEventHub } from "@/tools/menu-event-hub";
import AddItem from "./AddItem.vue";
import TreeMenuItem from "./TreeMenuItem.vue";
import { Button, Hierarchy } from "@/datatypes"; // eslint-disable-line no-unused-vars
import debounce from "@/tools/debounce";
import { allItems, moveDown, moveUp } from "@/datatypes/hierarchy";

export default Vue.extend({
    name: "TreeMenu",
    props: {
        items: Object as PropType<Hierarchy>,
        buttons: Array as PropType<Button[]>,
        editable: Boolean,
        nameFields: Array as PropType<Array<{ label: string, propertyName: string }>>,
        selectedItem: Array as PropType<number[]>,
        initOpen: Boolean,
    },
    components:  { AddItem, TreeMenuItem },
    data() {
        const initOpenItems: string[] = [];
        
        let item = this.items;
        for (const index of this.selectedItem) {
            initOpenItems.push(item.id);
            item = item.children[index];
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
        itemsToDisplay(): Hierarchy[] {
            if (this.menuFilter === "") {
                return this.items.children;
            } else {
                return allItems(this.items).
                        filter(item => this.nameFields!.
                        map(field => (item.name as any)[field.propertyName]).
                        some(name => name?.toUpperCase().includes(this.menuFilter?.toUpperCase()) ?? false));
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
        moveItemUp(path: number[]) {
            moveUp(this.items, path);
        },
        moveItemDown(path: number[]) {
            moveDown(this.items, path);
        },
        buttonClicked(e: string) {
            this.$emit("button-click", e);
        },
    }
});
</script>