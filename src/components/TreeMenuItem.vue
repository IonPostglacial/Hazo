<template>
    <li>
        <div class="horizontal-flexbox center-items medium-height">
            <label v-if="hasArrows" v-on:click="toggleOpen" class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered">
                <div v-if="open" class="bottom-arrow">&nbsp;</div>
                <div v-if="!open" class="left-arrow">&nbsp;</div>
            </label>
            <label :class="['medium-line-height', 'blue-hover', 'flex-grow-1', 'medium-padding', 'horizontal-flexbox', 'center-items', { 'background-color-1': selected }]" v-on:click="select">
                <div v-if="isFirstColumn" class="min-width-small">{{ prettyId }}</div>
                <slot v-bind:item="{id: item.id, name: itemName }">
                    <div :class="['flex-grow-1', 'nowrap', { 'warning-color': item.warning }]">{{ itemName }}</div>
                </slot>
            </label>
            <button class="background-color-1" v-for="button in itemButtons" :key="button.id" v-on:click="buttonClicked(button.id)">{{ button.label }}</button>
            <div v-if="editable && isLastColumn" @click="moveUp" class="move-up">🡡</div>
            <div v-if="editable && isLastColumn" @click="moveDown" class="move-down">🡣</div>
            <div v-if="editable && isLastColumn" class="close" @click="deleteItem"></div>
        </div>
        <div class="horizontal-flexbox start-aligned">
            <div v-if="isFirstColumn" class="indentation-width"></div>
            <div v-if="open" class="flex-grow-1">
                <TreeMenuItem v-for="child in childrenToDisplay" :item-bus="itemBus" :key="child.id" :editable="editable"       
                    :is-first-column="isFirstColumn"
                    :is-last-column="isLastColumn"
                    :init-open="initOpen"
                    :space-for-add="spaceForAdd"
                    :selected-item="selectedItem"
                    :init-open-items="initOpenItems"
                    :name-field="nameField" :items-hierarchy="itemsHierarchy" :item="child" :buttons="buttons" 
                    v-on="$listeners" :parent-id="item.id" v-slot:default="menuItemProps">
                    <slot v-bind:item="menuItemProps.item"></slot>
                </TreeMenuItem>
                <li v-if="editable || spaceForAdd" :class="{ 'visibility-hidden': spaceForAdd }">
                    <add-item v-on:add-item="addItem"></add-item>
                </li>
            </div>
        </div>
    </li>
</template>

<script lang="ts">
import { HierarchicalItem } from "../bunga"; // eslint-disable-line no-unused-vars
import { Button } from "@/bunga/Button"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { MenuEventHub } from "@/tools/menu-event-hub"; // eslint-disable-line no-unused-vars
import { Hierarchy } from '@/bunga/hierarchy'; // eslint-disable-line no-unused-vars

const knownPrefixes = ["t", "myt-", "c", "s", "d", "myd-"];

export default Vue.extend({
    name: "TreeMenuItem",
    props: {
        itemBus: Object as PropType<MenuEventHub>,
        item: Object as PropType<HierarchicalItem<any>>,
        itemsHierarchy: Object as PropType<Hierarchy<any>>,
        buttons: Array as PropType<Array<Button>>,
        nameField: Object as PropType<{ label: string, propertyName: string }>,
        editable: Boolean,
        spaceForAdd: Boolean,
        isFirstColumn: Boolean,
        isLastColumn: Boolean,
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
        this.itemBus?.onOpenAll(() => this.open = (this.itemsHierarchy?.hasChildren(this.item)) ?? false);
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
            return this.isFirstColumn && (this.itemsHierarchy!.hasChildren(this.item) || this.editable);
        },
        itemName(): string {
            const name = (this.item as any)[this.nameField!.propertyName ?? "name"];
            if (typeof name === "undefined" || name === null || name === "") {
                return "_";
            } else {
                return name;
            }
        },
        childrenToDisplay(): Iterable<any> {
            return this.itemsHierarchy?.childrenOf(this.item) ?? []
        },
    },
    methods: {
        select() {
            this.$emit("selected", this.item?.id);
        },
        toggleOpen() {
            this.itemBus?.emitToggle(this.item!.id);
        },
        addItem({detail}: {detail: string}) {
            this.$emit("add-item", { value: detail, parentId: this.item?.id });
        },
        deleteItem() {
            this.$emit("delete-item", { parentId: this.item?.parentId, id: this.item?.id, itemId: this.item?.id });
        },
        buttonClicked(buttonId: string) {
            this.$emit("button-click", { buttonId, parentId: this.item?.parentId, id: this.item?.id, itemId: this.item?.id });
        },
        moveUp() {
            console.log("up");
            this.$emit("move-item-up", this.item);
        },
        moveDown() {
            console.log("down");
            this.$emit("move-item-down", this.item);
        }
    }
});
</script>