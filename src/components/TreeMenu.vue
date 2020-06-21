<template>
    <div class="vertical-flexbox">
        <div class="white-background stick-to-top">
            <input type="search" v-model="menuFilter" placeholder="Filter" />
            <button type="button" v-on:click="openAll">Open All</button>
            <button type="button" v-on:click="closeAll">Close All</button>
        </div>
        <div class="horizontal-flexbox">
            <ul v-for="(nameField, fieldNum) in nameFields" :key="nameField"
                :class="'menu medium-padding ' + (fieldNum === 0 ? 'thin-border-right' : '')">
                <TreeMenuItem v-for="item in itemsToDisplay" :key="item.id" :item-bus="itemsBus" :item="item" :name="name" :editable="editable && fieldNum === 0" :buttons="buttons"
                    :name-fields="[nameField]"
                    v-on:input="$emit('input', $event)"
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
        nameFields: Array    
    },
    components:  { AddItem, TreeMenuItem },
    data() {
        return {
            menuFilter: "",
            itemsBus: new Vue(),
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