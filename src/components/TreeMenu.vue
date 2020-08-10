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
                <li class="flex-grow-1 no-list-style" v-for="(nameField, fieldNum) in nameFields" :key="nameField">
                    <label :class="'full-width button ' + (visibleColumns[fieldNum] ? 'background-color-1' : '')">
                        <input type="checkbox" class="invisible" v-model="visibleColumns[fieldNum]">col {{ fieldNum }}
                    </label>
                </li>
            </ul>
        </div>
        <div class="horizontal-flexbox">
            <ul v-for="(nameField, fieldNum) in (nameFields || ['name']).filter((e, i) => visibleColumns[i])" :key="nameField"
                :class="'menu medium-padding ' + (fieldNum !== 0 ? 'thin-border-left' : '')">
                <TreeMenuItem v-for="item in itemsToDisplay" :key="item.id" :item-bus="itemsBus" :item="item" :name="name"      
                    :show-ids="fieldNum === 0"
                    :space-for-add="editable && fieldNum > 0"
                    :editable="editable && fieldNum === 0" :buttons="buttons"
                    :name-field="nameField"
                    :selected-item="selectedItem"
                    :init-open-items="initOpenItems"
                    v-on:selected="selectItem"
                    v-on:add-item="addItem"
                    v-on:delete-item="deleteItem" 
                    v-on:button-clicked="buttonClicked">
                </TreeMenuItem>
            </ul>
        </div>
         <AddItem v-if="editable" v-on:add-item="addItem({ value: $event })"></AddItem>
    </div> 
</template>

<script>
import Vue from "../../node_modules/vue/dist/vue.esm.browser.js";
import AddItem from "./AddItem.vue";
import TreeMenuItem from "./TreeMenuItem";

export default {
    name: "TreeMenu",
    props: {
        name: String,
        items: Object,
        buttons: Array,
        editable: Boolean,
        nameFields: Array,
        selectedItem: String,
    },
    components:  { AddItem, TreeMenuItem },
    data() {
        const initOpenItems = [];
        let itemId = this.items[this.selectedItem]?.parentId;
        while (typeof itemId !== "undefined") {
            initOpenItems.push(itemId);
            itemId = this.items[itemId]?.parentId;
        }
        return {
            menuFilter: "",
            itemsBus: new Vue(),
            visibleColumns: (this.nameFields ?? ["name"]).map(() => true),
            initOpenItems: initOpenItems,
        };
    },
    computed: {
        itemsToDisplay() {
            if (!this.items) return [];
            return Object.values(this.items).filter((item) => {
                if (this.menuFilter !== "") {
                    return !item.hidden && this.nameFields.
                        map(field => item[field]).
                        some(name => name?.toUpperCase().startsWith(this.menuFilter?.toUpperCase()) ?? false);
                } else {
                    return !item.hidden && (this.parentId !== undefined || item.topLevel);
                }
            });
        },
    },
    methods: {
        selectItem(id) {
            this.$emit("select-item", id);
        },
        openAll() {
            this.itemsBus.$emit("openAll");
        },
        closeAll() {
            this.itemsBus.$emit("closeAll");
        },
        addItem(e) {
            this.$emit("add-item", e);
        },
        deleteItem(e) {
            this.$emit("delete-item", e);
        },
        buttonClicked(e) {
            this.$emit("button-click", e);
        },
    }
}
</script>