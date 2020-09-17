<template>
    <li>
        <div class="horizontal-flexbox center-items medium-height">
            <label v-if="hasArrows" v-on:click="toggleOpen" class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered">
                <div v-if="open" class="bottom-arrow">&nbsp;</div>
                <div v-if="!open" class="left-arrow">&nbsp;</div>
            </label>
            <label :class="'medium-line-height blue-hover flex-grow-1 medium-padding horizontal-flexbox center-items' + (selected ? ' background-color-1': '')" v-on:click="select">
                <div v-if="showIds" class="min-width-small margin-right-medium">{{ prettyId }}</div>
                <div :class="'flex-grow-1 nowrap ' + (item.warning ? 'warning-color' : '')">{{ itemName }}</div>
                <slot></slot>
            </label>
            <button class="background-color-1" v-for="button in itemButtons" :key="button.id" v-on:click="buttonClicked(button.id)">{{ button.label }}</button>
            <div v-if="editable" class="close" v-on:click="deleteItem"></div>
        </div>
        <div class="horizontal-flexbox start-aligned">
            <div class="indentation-width"></div>
            <div v-if="open" class="flex-grow-1">
                <TreeMenuItem v-for="child in childrenToDisplay" :item-bus="itemBus" :key="child.id" :editable="editable"       
                    :show-ids="showIds"
                    :init-open="initOpen"
                    :space-for-add="spaceForAdd"
                    :selected-item="selectedItem"
                    :init-open-items="initOpenItems"
                    :name-field="nameField" :item="child" :buttons="buttons" 
                    v-on="$listeners" :parent-id="item.id">
                </TreeMenuItem>
                <li v-if="editable || spaceForAdd" :class="spaceForAdd ? 'visibility-hidden' : ''">
                    <add-item v-on:add-item="addItem"></add-item>
                </li>
            </div>
        </div>
    </li>
</template>

<script lang="ts">
import { HierarchicalItem } from "../bunga"; // eslint-disable-line no-unused-vars
import { Button } from "../Button"; // eslint-disable-line no-unused-vars
import Vue from "vue";
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars
import { CombinedVueInstance } from 'vue/types/vue'; // eslint-disable-line no-unused-vars

const knownPrefixes = ["t", "myt-", "c", "s", "d", "myd-"];

export default Vue.extend({
    name: "TreeMenuItem",
    props: {
        itemBus: Object as PropValidator<CombinedVueInstance<any, any, any, any, any>>,
        item: Object as PropValidator<HierarchicalItem<any>>,
        buttons: Array as PropValidator<Array<Button>>,
        nameField: String,
        editable: Boolean,
        spaceForAdd: Boolean,
        showIds: Boolean,
        selectedItem: String,
        initOpen: Boolean,
        initOpenItems: Array as PropValidator<Array<string>>,
    },
    data() {
        return {
            open: this.initOpenItems.includes(this.item.id) || this.initOpen,
        };
    },
    mounted() {
        this.itemBus.$on("openAll", () => this.open = Object.keys(this.item.children).length > 0);
        this.itemBus.$on("closeAll", () => this.open = false);
        this.itemBus.$on("toggle", (id: string) =>  { if (id === this.item.id) { this.open = !this.open } });
    }, 
    computed: {
        selected() {
            return this.selectedItem === this.item.id;
        },
        prettyId() {
            for (const prefix of knownPrefixes) {
                if (this.item.id.startsWith(prefix)) {
                    return this.item.id.substring(prefix.length);
                }
            }
            return this.item.id;
        },
        itemButtons() {
            return this.buttons?.filter((button) => button.for === this.item.type);
        },
        hasArrows() {
            return Object.keys(this.item.children ?? {}).length > 0 || this.editable;
        },
        itemName() {
            const name = (this.item as any)[this.nameField ?? "name"];
            if (typeof name === "undefined" || name === null || name === "") {
                return "_";
            } else {
                return name;
            }
        },
        childrenToDisplay() {
            const children = this.item.children, childrenOrder = this.item.childrenOrder;
            return {
                *[Symbol.iterator]() {
                    for (const childId of childrenOrder) {
                        if (!children[childId].hidden) {
                            yield children[childId];
                        }
                    }
                }
            }
        },
    },
    methods: {
        select() {
            this.$emit("selected", this.item.id);
        },
        toggleOpen() {
            this.itemBus.$emit("toggle", this.item.id);
        },
        addItem({detail}: {detail: string}) {
            this.$emit("add-item", { value: detail, parentId: this.item.id });
        },
        deleteItem() {
            this.$emit("delete-item", { parentId: this.item.parentId, id: this.item.id, itemId: this.item.id });
        },
        buttonClicked(buttonId: string) {
            this.$emit("button-click", { buttonId, parentId: this.item.parentId, id: this.item.id, itemId: this.item.id });
        },
    }
});
</script>