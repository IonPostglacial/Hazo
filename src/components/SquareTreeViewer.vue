<template>
    <div class="vertical-flexbox">
        <input class="flex-grow-1" type="search" v-model="menuFilter" placeholder="Filter" />
        <div class="horizontal-flexbox flex-wrap button-group">
            <button v-if="currentItems !== rootItems" type="button" @click="backToTop">Top</button>
            <button v-for="breadCrumb in breadCrumbs" :key="breadCrumb.id" @click="goToBreadCrumb(breadCrumb)">{{ breadCrumb.name }}</button>
        </div>
        <div class="horizontal-flexbox flex-wrap relative">
            <component v-for="item in itemsToDisplay" :key="item.id" :is="isClickable(item) ? 'button' : 'div'" type="button" class="medium-square relative vertical-flexbox full-background thin-border white-background medium-padding medium-margin"
                    :style="item.photos.length > 0 ? 'background-image: url(' + item.photos[0].url + ')' : ''"
                    @click="openItem(item)">
                <div v-for="field in nameFieldsForItem(item)" :key="field"
                        :title="item[field]"
                        :class="['thin-border', 'medium-padding', 'text-ellipsed', item.selected ? 'background-color-1' : 'white-background', { 'text-underlined': isClickable(item) }]">
                    {{ item[field] }}
                </div>
            </component>
        </div>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Hierarchy, HierarchicalItem } from "@/datatypes"; // eslint-disable-line no-unused-vars

type ItemType = HierarchicalItem<any> & { selected?: boolean };

export default Vue.extend({
    name: "SquareTreeViewer",
    props: {
        editable: Boolean,
        rootItems: Object as PropType<Hierarchy<ItemType>>,
        nameFields: Array as PropType<Array<string>>,
    },
    data() {
        return {
            isRoot: true,
            currentItems: [...this.rootItems!.topLevelItems],
            breadCrumbs: [] as HierarchicalItem<any>[],
            menuFilter: "",
        }
    },
    watch: {
        rootItems(newRootItems: Hierarchy<ItemType>) {
            if (this.breadCrumbs.length - 1 < 0) return;
            const currentlyOpenItem = newRootItems.itemWithId(this.breadCrumbs[this.breadCrumbs.length - 1].id);
            if (typeof currentlyOpenItem !== "undefined") {
                this.currentItems = [...this.rootItems!.childrenOf(currentlyOpenItem)];
            }
        }
    },
    computed: {
        itemsToDisplay(): Iterable<HierarchicalItem<any>> {
            if (!this.currentItems) return [];
            const shouldDisplayItem = (item: HierarchicalItem<any> & { selected?: boolean }) => {
                if (!this.editable && item.selected === false) {
                    return false;
                }
                if (this.menuFilter !== "") {
                    return item.name.toUpperCase().startsWith(this.menuFilter?.toUpperCase());
                } else {
                    return this.isRoot ? item.topLevel : !item.topLevel;
                }
            };
            return this.currentItems.filter(shouldDisplayItem);
        },
    },
    methods: {
        nameFieldsForItem(item: any): Iterable<string> {
            return this.nameFields?.filter(field => typeof item[field] !== "undefined" && item[field] !== null && item[field] !== "") ?? [];
        },
        isClickable(item: HierarchicalItem<any>): boolean {
            return this.hasChildren(item) || this.isSelectable(item);
        },
        isSelectable(item: HierarchicalItem<any> & { selected?: boolean }): boolean {
            return this.editable && !this.rootItems!.hasChildren(item);
        },
        hasChildren(item: HierarchicalItem<any>): boolean {
            return this.rootItems?.hasChildren(item) ?? false;
        },
        openItem(item: HierarchicalItem<any> & { selected?: boolean }) {
            this.isRoot = false;
            if (this.hasChildren(item)) {
                this.breadCrumbs.push(item);
                this.currentItems = [...this.rootItems!.childrenOf(item)];
                this.$emit("item-open", { item });
            }
            if (this.isSelectable(item)) {
                this.$emit("item-selection-toggled", { item });
            }
        },
        backToTop() {
            this.isRoot = true;
            this.currentItems = [...this.rootItems!.topLevelItems];
            this.breadCrumbs = [];
        },
        goToBreadCrumb(breadCrumb: HierarchicalItem<any>) {
            const index = this.breadCrumbs.findIndex(b => b.id === breadCrumb.id);
            this.breadCrumbs = this.breadCrumbs.slice(0, index + 1);
            this.currentItems = [...this.rootItems!.childrenOf(breadCrumb)];
        }
    },
});
</script>