<template>
    <div class="vertical-flexbox">
        <input class="flex-grow-1" type="search" v-model="menuFilter" placeholder="Filter" />
        <div class="horizontal-flexbox flex-wrap button-group">
            <button v-if="currentItems !== rootItems" type="button" @click="backToTop">Top</button>
            <button v-for="breadCrumb in breadCrumbs" :key="breadCrumb.id" @click="goToBreadCrumb(breadCrumb)">{{ breadCrumb.name.S }}</button>
        </div>
        <div v-if="!floweringMode" class="horizontal-flexbox flex-wrap relative">
            <component v-for="item in itemsToDisplay" :key="item.id" :is="isClickable(item) ? 'button' : 'div'" type="button" class="medium-square relative vertical-flexbox full-background thin-border white-background medium-padding medium-margin"
                    :style="item.pictures.length > 0 ? 'background-image: url(' + item.pictures[0].url + ')' : ''"
                    @click="openItem(item)">
                <div v-for="field in nameFieldsForItem(item)" :key="field"
                        :title="item.name[field]"
                        :class="['thin-border', 'medium-padding', 'text-ellipsed', isSelected(item) ? 'background-color-1' : 'white-background', { 'text-underlined': isClickable(item) }]">
                    {{ item.name[field] }}
                </div>
                <button v-if="item.parentId && hasChildren(item)" @click.stop="selectWithoutOpening(item)" class="thin-border medium-padding text-ellipsed white-background">no more precision</button>
            </component>
        </div>
        <div v-if="floweringMode">
            <flowering v-model="flowering" @month-selected="monthToggled" @month-unselected="monthToggled"></flowering>
        </div>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Hierarchy, HierarchicalItem } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Flowering from "./Flowering.vue";
import { Character } from "@/datatypes";
import Months from "@/datatypes/Months";
import clone from "@/tools/clone";
type ItemType = HierarchicalItem & { selected?: boolean };

export default Vue.extend({
    name: "SquareTreeViewer",
    components: { Flowering },
    props: {
        editable: Boolean,
        rootItems: Object as PropType<Hierarchy<ItemType>>,
        nameFields: Array as PropType<Array<string>>,
    },
    data() {
        const currentItems = [...this.rootItems!.topLevelItems];
        return {
            flowering: Months.fromStates(currentItems.filter(item => item.selected)),
            floweringMode: false,
            isRoot: true,
            currentItems: currentItems,
            breadCrumbs: [] as HierarchicalItem[],
            menuFilter: "",
        }
    },
    watch: {
        rootItems(newRootItems: Hierarchy<ItemType>) {
            if (this.breadCrumbs.length - 1 < 0) return;
            const currentlyOpenItem = newRootItems.itemWithId(this.breadCrumbs[this.breadCrumbs.length - 1].id);
            if (typeof currentlyOpenItem !== "undefined") {
                this.floweringMode = currentlyOpenItem.type === "character" && (currentlyOpenItem as Character).preset === "flowering";
                this.currentItems = [...this.rootItems!.childrenOf(currentlyOpenItem)];
                this.flowering = Months.fromStates(this.currentItems.filter(item => item.selected));
            }
        },
        currentItems(items: ItemType[]) {
            this.flowering = Months.fromStates(items.filter(item => item.selected));
        }
    },
    computed: {
        itemsToDisplay(): Iterable<HierarchicalItem> {
            if (!this.currentItems) return [];
            const shouldDisplayItem = (item: HierarchicalItem & { selected?: boolean }) => {
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
        nameFieldsForItem(item: any): Iterable<string> {
            return this.nameFields?.filter(field => typeof item.name[field] !== "undefined" && item.name[field] !== null && item.name[field] !== "") ?? [];
        },
        isClickable(item: HierarchicalItem): boolean {
            return this.hasChildren(item) || this.isSelectable(item);
        },
        isSelected(item: HierarchicalItem & { selected?: boolean }): boolean {
            return item.selected ?? false;
        },
        isSelectable(item: HierarchicalItem & { selected?: boolean }): boolean {
            return this.editable && !this.rootItems!.hasChildren(item);
        },
        hasChildren(item: HierarchicalItem): boolean {
            return this.rootItems?.hasChildren(item) ?? false;
        },
        openItem(item: HierarchicalItem & { selected?: boolean }) {
            this.isRoot = false;
            this.floweringMode = item.type === "character" && (item as Character).preset === "flowering";
            if (this.hasChildren(item)) {
                this.breadCrumbs.push(item);
                this.currentItems = [...this.rootItems!.childrenOf(item)];
                this.$emit("item-open", { item });
            }
            if (this.isSelectable(item)) {
                this.$emit("item-selection-toggled", { item });
            }
        },
        selectWithoutOpening(character: Character & { selected?: boolean }) {
            if (typeof character.inherentState === "undefined") {
                character.inherentState = { id: "", name: clone(character.name), pictures: [] };
                const parentCharacter = Hazo.store.dataset.charactersHierarchy.itemWithId(character.parentId);
                if (typeof parentCharacter !== "undefined") {
                    Hazo.store.do("addState", { state: character.inherentState, character: parentCharacter });
                }
            }
            this.$emit("item-selection-toggled", { item: character.inherentState });
        },
        monthToggled(monthIndex: number) {
            this.$emit("item-selection-toggled", { item: Months.floweringStates[monthIndex] });
        },
        backToTop() {
            this.isRoot = true;
            this.floweringMode = false;
            this.currentItems = [...this.rootItems!.topLevelItems];
            this.breadCrumbs = [];
        },
        goToBreadCrumb(breadCrumb: HierarchicalItem) {
            const index = this.breadCrumbs.findIndex(b => b.id === breadCrumb.id);
            this.breadCrumbs = this.breadCrumbs.slice(0, index + 1);
            this.currentItems = [...this.rootItems!.childrenOf(breadCrumb)];
        }
    },
});
</script>