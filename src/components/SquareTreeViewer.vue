<template>
    <VBox class="white-background">
        <VBox class="stick-to-top glass-background thin-border">
            <input class="flex-grow-1" type="search" v-model="menuFilter" placeholder="Filter" />
            <div v-if="breadCrumbs.length > 0" class="flex-wrap button-group">
                <button type="button" @click="backToTop">Top</button>
                <button v-for="breadCrumb in breadCrumbs" :key="breadCrumb.id" @click="goToBreadCrumb(breadCrumb)">{{ breadCrumb.name.S }}</button>
            </div>
        </VBox>
        <HBox v-if="!floweringMode" class="flex-wrap relative">
            <component v-for="item in itemsToDisplay" :key="item.id" :is="isClickable(item) ? 'button' : 'div'" type="button" class="medium-square relative vertical-flexbox full-background thin-border white-background medium-padding medium-margin"
                    :style="item.pictures.length > 0 ? 'background-image: url(' + item.pictures[0].url + ')' : ''"
                    @click="openItem(item)">
                <div v-for="field in nameFieldsForItem(item)" :key="field"
                        :title="item.name[field]"
                        :class="['thin-border', 'medium-padding', 'text-ellipsed', isSelected(item) ? 'background-color-1' : 'white-background', { 'text-underlined': isClickable(item) }]">
                    {{ item.name[field] }}
                </div>
                <button v-if="item.parentId && hasChildren(item)" @click.stop="selectWithoutOpening(item as HierarchicalItem)" class="thin-border medium-padding text-ellipsed white-background">no more precision</button>
            </component>
        </HBox>
        <div v-if="floweringMode">
            <flowering v-model="flowering" @month-selected="monthToggled" @month-unselected="monthToggled"></flowering>
        </div>
    </VBox>
</template>

<script lang="ts">
import { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Hierarchy, HierarchicalItem, characterFromId } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Flowering from "./Flowering.vue";
import GeoView from "./GeoView.vue";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import { Character } from "@/datatypes";
import Months from "@/datatypes/Months";
import clone from "@/tools/clone";
import makeid from "@/tools/makeid";
import { DiscreteCharacter, SelectableItem } from "@/datatypes/types";


export default {
    name: "SquareTreeViewer",
    components: { Flowering, GeoView, HBox, VBox },
    props: {
        editable: Boolean,
        rootItems: Object as PropType<Hierarchy<SelectableItem>>,
        nameFields: Array as PropType<string[]>,
    },
    data() {
        const currentItems = [...this.rootItems!.children];
        return {
            flowering: Months.fromStates(currentItems.filter(item => item.selected)),
            floweringMode: false,
            isRoot: true,
            currentItems: currentItems,
            breadCrumbs: [] as Hierarchy<SelectableItem>[],
            menuFilter: "",
        };
    },
    watch: {
        rootItems(newRootItems: Hierarchy<SelectableItem>) {
            let currentlyOpenItem = newRootItems;
            for (const breadCrumb of this.breadCrumbs) {
                const it = currentlyOpenItem.children.find(it => it.id === breadCrumb.id);
                if (typeof it === "undefined") return;
                currentlyOpenItem = it;
            }
            if (typeof currentlyOpenItem !== "undefined") {
                this.updateCurrentItem(currentlyOpenItem);
                this.currentItems = [...currentlyOpenItem.children];
                this.flowering = Months.fromStates(this.currentItems.filter(item => item.selected));
            }
        },
        currentItems(items: Hierarchy<SelectableItem>[]) {
            this.flowering = Months.fromStates(items.filter(item => item.selected));
        }
    },
    computed: {
        itemsToDisplay(): Iterable<Hierarchy<SelectableItem>> {
            if (!this.currentItems) return [];
            const shouldDisplayItem = (item: SelectableItem) => {
                if (!this.editable && item.selected === false) {
                    return false;
                }
                if (this.menuFilter !== "") {
                    return item.name.S.toUpperCase().startsWith(this.menuFilter?.toUpperCase());
                } else {
                    return true;
                }
            };
            return this.currentItems.filter(shouldDisplayItem);
        },
    },
    methods: {
        updateCurrentItem(item: Hierarchy<SelectableItem>) {
            this.floweringMode = this.isFlowering(item);
        },
        resetCurrentItem() {
            this.floweringMode = false;
        },
        nameFieldsForItem(item: any): Iterable<string> {
            return this.nameFields?.filter(field => typeof item.name[field] !== "undefined" && item.name[field] !== null && item.name[field] !== "") ?? [];
        },
        isClickable(item: Hierarchy<SelectableItem>): boolean {
            return this.hasChildren(item) || this.isSelectable(item);
        },
        isSelected(item: Hierarchy<SelectableItem>): boolean {
            return item.selected ?? false;
        },
        isSelectable(item: Hierarchy<SelectableItem>): boolean {
            return this.editable && item.children.length === 0;
        },
        hasChildren(item: Hierarchy<SelectableItem>): boolean {
            return item.children.length > 0;
        },
        isFlowering(item: Hierarchy<SelectableItem>): boolean {
            return (item as HierarchicalItem).type === "character" &&
                    (item as Character).characterType === "discrete" &&
                    (item as DiscreteCharacter).preset === "flowering"
        },
        isGeographic(item: Hierarchy<SelectableItem>): boolean {
            return (item as HierarchicalItem).type === "character" &&
                    (item as Character).characterType === "discrete" &&
                    (item as DiscreteCharacter).preset === "map"
        },
        openItem(item: Hierarchy<SelectableItem>) {
            this.isRoot = false;
            this.updateCurrentItem(item);
            if (item.children.length > 0) {
                this.breadCrumbs.push(item);
                this.currentItems = [...item.children];
                this.$emit("item-open", { item });
            }
            if (this.isSelectable(item)) {
                this.$emit("item-selection-toggled", { item });
            }
        },
        selectWithoutOpening(character: HierarchicalItem) {
            if (character.type !== "character" || character.characterType !== "discrete") return;
            const ch = characterFromId(Hazo.store.dataset, character.id);
            let inherentState = ch?.characterType === "range" ? undefined : ch?.inherentState;
            if (typeof inherentState === "undefined") {
                const parentCharacter = characterFromId(Hazo.store.dataset, character.parentId);
                if (typeof parentCharacter !== "undefined" && parentCharacter.characterType === "discrete") {
                    inherentState = { id: "s" + makeid(8), type: "state", name: clone(character.name), pictures: [] };
                    Hazo.store.do("addState", { state: inherentState, character: parentCharacter });
                    Hazo.store.do("setInherentState", { state: inherentState, character });
                }
            }
            this.$emit("item-selection-toggled", { item: inherentState });
        },
        monthToggled(monthIndex: number) {
            const character = this.breadCrumbs[this.breadCrumbs.length - 1];
            const ch = characterFromId(Hazo.store.dataset, character.id);
            if (typeof ch === "undefined" || ch.characterType !== "discrete") { return; }
            this.$emit("item-selection-toggled", { item: ch.states[monthIndex] });
        },
        backToTop() {
            this.isRoot = true;
            this.resetCurrentItem();
            this.currentItems = [...this.rootItems!.children];
            this.breadCrumbs = [];
        },
        goToBreadCrumb(breadCrumb: Hierarchy<SelectableItem>) {
            this.updateCurrentItem(breadCrumb);
            const index = this.breadCrumbs.findIndex(b => b.id === breadCrumb.id);
            this.breadCrumbs = this.breadCrumbs.slice(0, index + 1);
            this.currentItems = [...breadCrumb.children];
        }
    },
};
</script>