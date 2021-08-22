<template>
    <li>
        <div class="horizontal-flexbox center-items">
            <div class="indent">&nbsp;</div>
            <label v-on:click="toggleOpen" :class="['small-square', 'blue-circle-hover', 'thin-margin', 'vertical-flexbox', 'flex-centered', { 'visibility-hidden': !hasArrows }]">
                <div v-if="open" class="bottom-arrow">&nbsp;</div>
                <div v-if="!open" class="left-arrow">&nbsp;</div>
            </label>
            <div class="horizontal-flexbox flex-centered unselectable">{{ prettyId }}</div>
        </div>
        <div v-for="nameField in fieldNames" :key="nameField.propertyName"
                :class="['medium-line-height', 'flex-grow-1', 'medium-padding', 'horizontal-flexbox', 'center-items', 'cell', 'blue-hover-line', { 'background-color-1': selected }]">
            <div class="horizontal-flexbox center-items flex-grow-1 medium-height">
                <label class="horizontal-flexbox flex-grow-1 unselectable" v-on:click="select">
                    <slot v-bind:item="{id: item.id, name: item.name[nameField.propertyName] }">
                        <div :class="['flex-grow-1', 'nowrap', { 'warning-color': item.warning }]">{{ item[nameField.propertyName] }}</div>
                    </slot>
                </label>
            </div>
        </div>
        <div v-if="editable" class="horizontal-flexbox flex-centered">
            <button class="background-color-1" v-for="button in itemButtons" :key="button.id" v-on:click="buttonClicked(button.id)">{{ button.label }}</button>
            <div @click="moveUp" class="move-up">🡡</div>
            <div @click="moveDown" class="move-down">🡣</div>
            <div class="close" @click="deleteItem"></div>
        </div>
        <ul v-if="open" class="flex-grow-1">
            <TreeMenuItem v-for="child in item.children" :item-bus="itemBus" :key="child.id" :editable="editable"       
                :init-open="initOpen"
                :selected-item="selectedItem"
                :init-open-items="initOpenItems"
                :field-names="fieldNames" :item="child" :buttons="buttons" 
                v-on="$listeners" :parent-id="item.id" v-slot:default="menuItemProps">
                <slot v-bind:item="menuItemProps.item"></slot>
            </TreeMenuItem>
            <li v-if="editable">
                <add-item class="full-line" @add-item="addItem"></add-item>
            </li>
        </ul>
    </li>
</template>

<script lang="ts">
import { Button, Hierarchy } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { MenuEventHub } from "@/tools/menu-event-hub"; // eslint-disable-line no-unused-vars
import AddItem from "./AddItem.vue";

const knownPrefixes = ["t", "myt-", "c", "s", "d", "myd-"];

export default Vue.extend({
    components: { AddItem },
    name: "TreeMenuItem",
    props: {
        itemBus: Object as PropType<MenuEventHub>,
        item: Object as PropType<Hierarchy>,
        buttons: Array as PropType<Array<Button>>,
        fieldNames: Array as PropType<{ label: string, propertyName: string }[]>,
        editable: Boolean,
        selectedItem: String,
        initOpen: Boolean,
        initOpenItems: Array as PropType<Array<string>>,
    },
    data() {
        return {
            open: this.initOpenItems?.includes(this.item!.id) ?? this.initOpen,
        };
    },
    mounted() {
        this.itemBus?.onOpenAll(() => this.open = this.item.children.length > 0 ?? false);
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
        itemButtons(): Button[]|undefined {
            return this.buttons?.filter((button) => button.for === this.item?.type);
        },
        hasArrows(): boolean {
            return (this.item.children.length > 0 || this.editable);
        },
    },
    methods: {
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
            this.$emit("delete-item", { parentId: 42, id: this.item?.id, itemId: this.item?.id });
        },
        buttonClicked(buttonId: string) {
            this.$emit("button-click", { buttonId, parentId: 42, id: this.item?.id, itemId: this.item?.id });
        },
        moveUp() {
            this.$emit("move-item-up", this.item);
        },
        moveDown() {
            this.$emit("move-item-down", this.item);
        }
    }
});
</script>