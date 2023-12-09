<template>
    <VBox>
        <VBox class="stick-to-top glass-background thin-border">
            <HBox class="thin-margin center-items">
                <input class="flex-grow-1" type="search" @input="updateSearchFilter" :value="visibleFilter" placeholder="Filter" />
                <Spacer></Spacer>
                <HBox class="button-group">
                    <button type="button" v-on:click="openAll">
                        <font-awesome-icon icon="fa-solid fa-plus" />
                    </button>
                    <button type="button" v-on:click="closeAll">
                        <font-awesome-icon icon="fa-solid fa-minus" />
                    </button>
                </HBox>
            </HBox>
            <ul v-if="nameFields && nameFields.length > 1" class="thin-margin horizontal-flexbox button-group">
                <button @click="$emit('unselected')" title="unselect">
                    <font-awesome-icon icon="fa-solid fa-notdef" />
                </button>
                <li v-for="nameField in nameFields" :key="nameField.propertyName" :class="['flex-grow-1', 'button', 'no-list-style', { 'background-color-1': visibleColumns[nameField.propertyName] }]" @click="toggleColumnVisibility(nameField.propertyName)">
                    {{ nameField.label }}
                </li>
            </ul>
        </VBox>
        <ul :class="['menu', 'big-padding-right', 'tree-grid', 'tree-cols-' + columnsToDisplay.length, { editable: editable }]">
            <TreeMenuItem v-for="(item, index) in itemsToDisplay" :key="item.id" :item-bus="itemsBus"
                :item="item"
                :editable="editable" :buttons="buttons"
                :field-names="columnsToDisplay"
                :selected-item="selectedItem"
                :init-open="initOpen"
                :init-open-items="initOpenItems"
                :path="[index]"
                @selected="selectItem"
                @add-item="addItem"
                @delete-item="deleteItem" 
                @button-clicked="buttonClicked"
                @move-item-up="moveItemUp"
                @move-item-down="moveItemDown" v-slot:default="menuItemProps">
                <slot v-bind:item="menuItemProps.item"></slot>
            </TreeMenuItem>
        </ul>
        <div class="flex-grow-1">&nbsp;</div>
        <AddItem v-if="editable" class="stick-to-bottom" :name-fields="nameFields" :name-store="nameStore" @add-item="addItem({ value: $event.detail })"></AddItem>
    </VBox> 
</template>

<script lang="ts">
import { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { createMenuEventHub } from "@/tools/menu-event-hub";
import AddItem from "./AddItem.vue";
import TreeMenuItem, { Button, MenuItem } from "./TreeMenuItem.vue";
import HBox from "./HBox.vue";
import VBox from "./VBox.vue";
import Spacer from "./Spacer.vue";
import { HierarchicalItem } from "@/datatypes"; // eslint-disable-line no-unused-vars
import debounce from "@/tools/debounce";
import { iterHierarchy } from "@/datatypes/hierarchy";
import { NameStore } from "@/db-index";


export default {
    name: "TreeMenu",
    props: {
        items: { type: Object as PropType<MenuItem>, required: true },
        buttons: Array as PropType<Button[]>,
        editable: Boolean,
        nameFields: Array as PropType<Array<{ label: string, propertyName: string }>>,
        selectedItem: String,
        initOpen: Boolean,
        nameStore: Object as PropType<NameStore>,
    },
    components:  { AddItem, HBox, Spacer, TreeMenuItem, VBox },
    data() {
        const initOpenItems: string[] = [];
        const shouldBeOpen = (h: MenuItem) => {
            if (h.id === this.selectedItem) {
                return true;
            }
            for (const child of h.children) {
                if (shouldBeOpen(child)) {
                    initOpenItems.push(h.id);
                    return true;
                }
            }
            return false;
        }
        shouldBeOpen(this.items);
        return {
            menuFilter: "",
            visibleFilter: "",
            itemsBus: createMenuEventHub(),
            visibleColumns: Object.fromEntries(this.nameFields!.map((e) => [e.propertyName, true])),
            initOpenItems: initOpenItems,
        };
    },
    computed: {
        columnsToDisplay(): { label: string, propertyName: string }[] {
            return this.nameFields?.filter(nameField => this.visibleColumns[nameField.propertyName]) ?? [];
        },
        itemsToDisplay(): Iterable<MenuItem> {
            if (!this.items) return [];
            if (this.menuFilter !== "") {
                const self = this;
                return {
                    *[Symbol.iterator]() {
                        for (const item of iterHierarchy(self.items)) {
                            if (self.nameFields!.
                                    map(field => (item.name as any)[field.propertyName]).
                                    some(name => name?.toUpperCase().includes(self.menuFilter?.toUpperCase()) ?? false)) {
                                yield item;
                            }
                        }
                    }
                };
            } else {
                return this.items.children;
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
        moveItemUp(e: HierarchicalItem) {
            this.$emit("move-item-up", e);
        },
        moveItemDown(e: HierarchicalItem) {
            this.$emit("move-item-down", e);
        },
        buttonClicked(e: string) {
            this.$emit("button-click", e);
        },
    }
};
</script>