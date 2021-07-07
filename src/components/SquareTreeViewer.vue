<template>
    <div class="vertical-flexbox">
        {{floweringMode}}
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
                        :class="['thin-border', 'medium-padding', 'text-ellipsed', item.selected ? 'background-color-1' : 'white-background', { 'text-underlined': isClickable(item) }]">
                    {{ item.name[field] }}
                </div>
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
import { presetStates } from "@/datatypes/Character";
type ItemType = HierarchicalItem & { selected?: boolean };

function computeFlowering(currentItems: ItemType[]): number {
    let flowering = 0;
    for (const item of currentItems) {
        if (item.selected) {
            const monthIndex = presetStates.flowering.findIndex(s => s.id === item.id);
            flowering |= (1 << monthIndex);
        }
    }
    return flowering;
}

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
            flowering: computeFlowering(currentItems),
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
                this.flowering = computeFlowering(this.currentItems);
            }
        },
        currentItems(items: ItemType[]) {
            this.flowering = computeFlowering(items);
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
        monthToggled(monthIndex: number) {
            this.$emit("item-selection-toggled", { item: presetStates.flowering[monthIndex] });
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