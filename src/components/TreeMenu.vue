<template>
    <ul :class="'menu ' + (!parent ? 'medium-padding' : '')">
        <li v-if="!parent">
            <input type="search" v-model="menuFilter" placeholder="Filter" />
            <button type="button" v-on:click="openAll">Open All</button>
            <button type="button" v-on:click="closeAll">Close All</button>
        </li>
        <li v-for="item in itemsToDisplay" :key="item.id">
            <div class="horizontal-flexbox center-items">
                <div v-if="hasArrows(item)" class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered" v-on:click="toggleItemOpening(item)">
                    <div v-if="openingByItemId[item.id]" class="bottom-arrow">&nbsp;</div>
                    <div v-if="!openingByItemId[item.id]" class="left-arrow">&nbsp;</div>
                </div>
                <input type="radio" class="invisible" :value="item.id" :id="name + '-' + item.id" :name="name" v-on:input="$emit('input', $event.target.value)" />
                <label class="blue-hover flex-grow-1 medium-padding horizontal-flexbox center-items" :for="name + '-' + item.id">
                    <div :class="'flex-grow-1 ' + (item.warning ? 'warning-color' : '')">{{ getItemName(item) }}</div>
                    <slot></slot>
                    <div v-if="hasCompositeNames" class="medium-margin-horizontal">{{ getItemOtherNames(item) }}</div>
                </label>
                <button class="background-color-1" v-for="button in buttonsForItem(item)" :key="button.id" v-on:click="buttonClicked(button.id, item.parentId, item.id, item.id)">{{ button.label }}</button>
                <div v-if="editable" class="close" v-on:click="deleteItem(item.parentId, item.id, item.id)"></div>
            </div>
            <div class="horizontal-flexbox start-aligned">
                <div class="indentation-width"></div>
                <div class="flex-grow-1">
                    <TreeMenu v-if="openingByItemId[item.id]" :editable="editable" :name-fields="nameFields" :name="name" :items="item.children" :buttons="buttons" v-on="$listeners" :parent="item.id"
                    :parent-opening-by-item-id="openingByItemId">
                    </TreeMenu>
                </div>
            </div>
        </li>
        <li v-if="editable">
            <AddItem v-on:add-item="addItem($event, parent)"></AddItem>
        </li>
    </ul>    
</template>

<script>
import Vue from "../../node_modules/vue/dist/vue.esm.browser.js";
import AddItem from "./AddItem.vue";

export default {
    name: "TreeMenu",
    props: ["name", "items", "buttons", "parent", "editable", "name-fields", "parent-opening-by-item-id"],
    components:  { AddItem },
    data() {
        return {
            menuFilter: "",
            openingByItemId: this.parentOpeningByItemId ?? {},
        };
    },
    computed: {
        itemsToDisplay() {
            if (!this.items) return [];
            return Object.values(this.items).filter((item) => {
                if (this.menuFilter !== "") {
                    return !item.hidden && this.getItemName(item).toUpperCase().startsWith(this.menuFilter.toUpperCase());
                } else {
                    return !item.hidden && (this.parent !== undefined || item.topLevel);
                }
            });
        },
        hasCompositeNames() {
            return this.nameFields?.length > 1;
        }
    },
    methods: {
        buttonsForItem(item) {
            return this.buttons?.filter((button) => button.for === item.type);
        },
        hasArrows(item) {
            return Object.keys(item.children ?? {}).length > 0 || this.editable;
        },
        toggleItemOpening(item) {
            Vue.set(this.openingByItemId, item.id, !this.openingByItemId[item.id]);
        },
        openAll() {
            for (const item of Object.values(this.items)) {
                Vue.set(this.openingByItemId, item.id, Object.keys(item.children ?? {}).length > 0);
            }
        },
        closeAll() {
            for (const item of Object.values(this.items)) {
                Vue.set(this.openingByItemId, item.id, false);
            }
        },
        getItemName(item) {
            const primaryNameField = this.nameFields ? this.nameFields[0] : "name";
            return item[primaryNameField];
        },
        getItemOtherNames(item) {
            return this.nameFields?.slice(1).map(field => item[field]).join(", ");
        },
        addItem(value, parentId) {
            this.$emit("add-item", { value, parentId });
        },
        deleteItem(parentId, id, itemId) {
            this.$emit("delete-item", { parentId, id, itemId });
        },
        buttonClicked(buttonId, parentId, id, itemId) {
            this.$emit("button-click", { buttonId, parentId, id, itemId });
        },
    }
}
</script>