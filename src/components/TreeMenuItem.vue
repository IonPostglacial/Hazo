<template>
    <li class="blue-hover-line">
        <div class="medium-height horizontal-flexbox center-items">
            <div class="indent">&nbsp;</div>
            <label v-on:click="toggleOpen" :class="['small-square', 'blue-circle-hover', 'thin-margin', 'vertical-flexbox', 'flex-centered', { 'visibility-hidden': !hasArrows }]">
                <div v-if="open" class="bottom-arrow">&nbsp;</div>
                <div v-if="!open" class="left-arrow">&nbsp;</div>
            </label>
            <div class="horizontal-flexbox flex-centered unselectable">{{ prettyId }}</div>
        </div>
        <div v-for="nameField in fieldNames" :key="nameField.propertyName"
                :class="['medium-height', 'medium-line-height', 'flex-grow-1', 'horizontal-flexbox', 'center-items', 'cell', { 'background-color-1': selected }]">
            <div class="horizontal-flexbox center-items flex-grow-1">
                <label class="horizontal-flexbox flex-grow-1 unselectable" v-on:click="select">
                    <slot v-bind:item="{id: item.id, name: itemName(nameField.propertyName) }">
                        <div :class="['flex-grow-1', 'nowrap', { 'warning-color': item.warning }]">{{ itemName(nameField.propertyName) }}</div>
                    </slot>
                </label>
            </div>
        </div>
        <div v-if="editable" class="medium-height horizontal-flexbox flex-centered">
            <button class="background-color-1" v-for="button in itemButtons" :key="button.id" v-on:click="buttonClicked(button.id)">{{ button.label }}</button>
            <div @click="moveUp" class="move-up">
                <font-awesome-icon icon="fa-solid fa-arrow-up" />
            </div>
            <div @click="moveDown" class="move-down">
                <font-awesome-icon icon="fa-solid fa-arrow-down" />
            </div>
            <div class="close" @click="deleteItem"></div>
        </div>
        <ul v-if="open">
            <TreeMenuItem v-for="(child, index) in childrenToDisplay" :item-bus="itemBus" :key="child.id" :editable="editable"       
                :init-open="initOpen"
                :path="[...path, index]"
                :selected-item="selectedItem"
                :init-open-items="initOpenItems"
                :field-names="fieldNames" :item="child" :buttons="buttons"
                @selected="$emit('selected', $event)"
                @add-item="$emit('add-item', $event)"
                @delete-item="$emit('delete-item', $event)" 
                @button-clicked="$emit('button-clicked', $event)"
                @move-item-up="$emit('move-item-up', $event)"
                @move-item-down="$emit('move-item-down', $event)"
                :parent-id="item.id"
                v-slot:default="menuItemProps">
                <slot v-bind:item="menuItemProps.item"></slot>
            </TreeMenuItem>
            <li v-if="editable">
                <add-item :value="''" class="medium-height full-line" @add-item="addItem"></add-item>
            </li>
        </ul>
    </li>
</template>

<script lang="ts">
import { Button, HierarchicalItem, Hierarchy } from "@/datatypes"; // eslint-disable-line no-unused-vars
import { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { MenuEventHub } from "@/tools/menu-event-hub"; // eslint-disable-line no-unused-vars
import AddItem from "./AddItem.vue";

const knownPrefixes = ["t", "myt-", "c", "s", "d", "myd-"];

export default {
    components: { AddItem },
    name: "TreeMenuItem",
    props: {
        itemBus: Object as PropType<MenuEventHub>,
        item: { type: Object as PropType<Hierarchy<HierarchicalItem> & { warning?: boolean }>, required: true },
        buttons: Array as PropType<Array<Button>>,
        fieldNames: Array as PropType<{ label: string, propertyName: string }[]>,
        editable: Boolean,
        selectedItem: String,
        initOpen: Boolean,
        initOpenItems: Array as PropType<Array<string>>,
        path: { type: Array as PropType<Array<number>>, required: true },
    },
    data() {
        return {
            open: this.initOpenItems?.includes(this.item!.id) ?? this.initOpen,
        };
    },
    mounted() {
        this.itemBus?.onOpenAll(() => this.open = (this.item.children.length > 0) ?? false);
        this.itemBus?.onCloseAll(() => this.open = false);
        this.itemBus?.onToggle((id: string) =>  { if (id === this.item!.id) { this.open = !this.open } });
    }, 
    computed: {
        selected(): boolean {
            return this.selectedItem === this.item?.id;
        },
        prettyId(): string {
            for (const prefix of knownPrefixes) {
                if (this.item?.id.startsWith(prefix)) {
                    return this.item.id.substring(prefix.length);
                }
            }
            return this.item?.id ?? "";
        },
        itemButtons(): Button[] {
            return this.buttons?.filter((button) => button.for === this.item?.type) ?? [];
        },
        hasArrows(): boolean {
            return (this.item.children.length > 0 || this.editable);
        },
        childrenToDisplay(): Array<any> {
            return this.item.children
        },
    },
    methods: {
        itemName(lang: string): string {
            if (lang == "S" || lang == "V" || lang == "CN" || lang == "EN" || lang == "FR") {
                return this.item.name[lang] ?? "";
            } else {
                return "";
            }
        },
        select() {
            this.$emit("selected", this.item?.id);
        },
        toggleOpen() {
            this.itemBus?.emitToggle(this.item!.id);
        },
        addItem({ detail }: { detail: string[] }) {
            this.$emit("add-item", { value: detail, parentId: this.item?.id });
        },
        deleteItem() {
            this.$emit("delete-item", { parentId: this.item?.parentId, id: this.item?.id, itemId: this.item?.id });
        },
        buttonClicked(buttonId: string) {
            this.$emit("button-click", { buttonId, parentId: this.item?.parentId, id: this.item?.id, itemId: this.item?.id });
        },
        moveUp() {
            this.$emit("move-item-up", this.item);
        },
        moveDown() {
            this.$emit("move-item-down", this.item);
        }
    }
};
</script>