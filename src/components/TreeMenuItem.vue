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
            <div v-if="editable" @click="moveUp" class="move-up">🡡</div>
            <div v-if="editable" @click="moveDown" class="move-down">🡣</div>
            <div v-if="editable" class="close" @click="deleteItem"></div>
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
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { MenuEventHub } from "../menu-event-hub"; // eslint-disable-line no-unused-vars

const knownPrefixes = ["t", "myt-", "c", "s", "d", "myd-"];

export default Vue.extend({
    name: "TreeMenuItem",
    props: {
        itemBus: Object as PropType<MenuEventHub>,
        item: Object as PropType<HierarchicalItem<any>>,
        buttons: Array as PropType<Array<Button>>,
        nameField: Object as PropType<{ label: string, propertyName: string }>,
        editable: Boolean,
        spaceForAdd: Boolean,
        showIds: Boolean,
        selectedItem: String,
        initOpen: Boolean,
        initOpenItems: Array as PropType<Array<string>>,
    },
    data() {
        return {
            open: this.initOpenItems.includes(this.item.id) || this.initOpen,
        };
    },
    mounted() {
        this.itemBus.onOpenAll(() => this.open = Object.keys(this.item.children).length > 0);
        this.itemBus.onCloseAll(() => this.open = false);
        this.itemBus.onToggle((id: string) =>  { if (id === this.item.id) { this.open = !this.open } });
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
            const name = (this.item as any)[this.nameField.propertyName ?? "name"];
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
                        yield children[childId];
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
            this.itemBus.emitToggle(this.item.id);
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