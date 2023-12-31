<template>
    <li class="blue-hover-line">
        <HBox class="medium-height center-items">
            <div class="indent">&nbsp;</div>
            <VBox v-on:click="toggleOpen" :class="['small-square', 'blue-circle-hover', 'thin-margin', 'flex-centered', { 'visibility-hidden': !hasArrows }]">
                <font-awesome-icon v-if="open" icon="fa-solid fa-chevron-down" />
                <font-awesome-icon v-if="!open" icon="fa-solid fa-chevron-right" />
            </VBox>
            <HBox class="flex-centered unselectable">{{ prettyId }}</HBox>
        </HBox>
        <HBox v-for="nameField in fieldNames" :key="nameField.propertyName"
                :class="['medium-height', 'medium-line-height', 'flex-grow-1', 'center-items', 'cell', { 'background-color-1': selected }]">
            <HBox class="center-items flex-grow-1">
                <label class="horizontal-flexbox flex-grow-1 unselectable" v-on:click="select">
                    <slot v-if="!selected" v-bind:item="{id: item.id, name: itemName(nameField.propertyName) }">
                        <div :class="['flex-grow-1', 'nowrap']">{{ itemName(nameField.propertyName) }}</div>
                    </slot>
                    <div v-if="selected" @click="unselect" class="flex-grow-1 nowrap text clickable">{{ itemName(nameField.propertyName) }}</div>
                </label>
            </HBox>
        </HBox>
        <HBox v-if="editable" class="medium-height flex-centered">
            <button class="background-color-1" v-for="button in itemButtons" :key="button.id" v-on:click="buttonClicked(button.id)">{{ button.label }}</button>
            <div @click="moveUp" class="move-up">
                <font-awesome-icon icon="fa-solid fa-arrow-up" />
            </div>
            <div @click="moveDown" class="move-down">
                <font-awesome-icon icon="fa-solid fa-arrow-down" />
            </div>
            <div class="close" @click="deleteItem"></div>
        </HBox>
        <ul v-if="open">
            <TreeMenuItem v-for="child in childrenToDisplay" :item-bus="itemBus" :key="child.id" :editable="editable"       
                :init-open="initOpen"
                :path="[...path, child.id]"
                :selected-item="selectedItem"
                :init-open-items="initOpenItems"
                :field-names="fieldNames" :item="child" :buttons="buttons"
                :name-store="nameStore"
                @selected="$emit('selected', $event)"
                @unselected="$emit('unselected')"
                @add-item="$emit('add-item', $event)"
                @delete-item="$emit('delete-item', $event)" 
                @button-clicked="$emit('button-clicked', $event)"
                @move-item-up="$emit('move-item-up', $event)"
                @move-item-down="$emit('move-item-down', $event)"
                :parent-id="item.id"
                v-slot:default="menuItemProps: { item: MenuItem }">
                <slot v-bind:item="menuItemProps.item"></slot>
            </TreeMenuItem>
            <li v-if="editable">
                <AddItem class="medium-height full-line" :name-fields="fieldNames" :name-store="nameStore" @add-item="addItem"></AddItem>
            </li>
        </ul>
    </li>
</template>

<script lang="ts">
import { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { MenuEventHub } from "@/tools/menu-event-hub"; // eslint-disable-line no-unused-vars
import AddItem from "./AddItem.vue";
import HBox from "./HBox.vue";
import VBox from "./VBox.vue";
import { Language, WordStore } from "@/db-index";


export type MenuItem = {
    id: string,
    path: string[],
    type: string,
    name: Partial<Record<string, string>>,
    children: MenuItem[],
};

export type Button = {
    id: string;
    for: string;
    label: string;
};

const knownPrefixes = ["t", "myt-", "c", "s", "d", "myd-"];

export default {
    components: { AddItem, HBox, VBox },
    name: "TreeMenuItem",
    props: {
        itemBus: Object as PropType<MenuEventHub>,
        item: { type: Object as PropType<MenuItem>, required: true },
        buttons: Array as PropType<Array<Button>>,
        fieldNames: Array as PropType<{ label: string, propertyName: Language }[]>,
        editable: Boolean,
        selectedItem: String,
        initOpen: Boolean,
        initOpenItems: Array as PropType<Array<string>>,
        path: { type: Array as PropType<Array<string>>, required: true },
        nameStore: Object as PropType<WordStore>,
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
                if (this.item.id.startsWith(prefix)) {
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
        unselect() {
            this.$emit("unselected");
        },
        toggleOpen() {
            this.itemBus?.emitToggle(this.item!.id);
        },
        addItem({ detail }: { detail: string[] }) {
            this.$emit("add-item", { value: detail, path: [...this.item.path, this.item.id] });
        },
        deleteItem() {
            this.$emit("delete-item", { path: this.item.path, id: this.item.id, itemId: this.item.id });
        },
        buttonClicked(buttonId: string) {
            this.$emit("button-click", { buttonId, path: this.item.path, id: this.item.id, itemId: this.item.id });
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