<template>
    <div class="vertical-flexbox">
        <input class="flex-grow-1" type="search" v-model="menuFilter" placeholder="Filter" />
        <div class="horizontal-flexbox flex-wrap">
            <button v-if="currentItems !== rootItems" type="button" @click="backToTop">Top</button>
            <button v-for="breadCrumb in breadCrumbs" :key="breadCrumb.id" @click="goToBreadCrumb(breadCrumb)">{{ breadCrumb.name }}</button>
        </div>
        <div class="horizontal-flexbox flex-wrap relative">
            <component v-for="item in itemsToDisplay" :key="item.id" :is="isClickable(item) ? 'button' : 'div'" type="button" class="square-1-3 relative vertical-flexbox full-background thin-border white-background medium-padding medium-margin"
                    :style="item.photos.length > 0 ? 'background-image: url(' + item.photos[0] + ')' : ''"
                    @click="openItem(item)">
                <div :class="'thin-border medium-padding ' + (item.selected ? 'background-color-1' : 'white-background')">{{ item.name }}</div>
            </component>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import { HierarchicalItem } from "../bunga"; // eslint-disable-line no-unused-vars
import { PropValidator } from 'vue/types/options'; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "SquareTreeViewer",
    props: {
        editable: Boolean,
        rootItems: Object as PropValidator<Record<string, HierarchicalItem & { selected?: boolean }>>,
    },
    data() {
        return {
            currentItems: this.rootItems,
            breadCrumbs: [] as HierarchicalItem[],
            menuFilter: "",
        }
    },
    computed: {
        itemsToDisplay(): Array<HierarchicalItem> {
            if (!this.currentItems) return [];
            return Object.values(this.currentItems).filter((item) => {
                if (!this.editable && item.selected === false) return false;
                if (this.menuFilter !== "") {
                    return !item.hidden && item.name.toUpperCase().startsWith(this.menuFilter?.toUpperCase());
                } else {
                    return !item.hidden && (this.currentItems === this.rootItems ? item.topLevel : !item.topLevel);
                }
            });
        },
    },
    methods: {
        isClickable(item: HierarchicalItem): boolean {
            return this.hasChildren(item) || this.isSelectable(item);
        },
        isSelectable(item: HierarchicalItem & { selected?: boolean }): boolean {
            return this.editable && typeof item.selected !== "undefined";
        },
        hasChildren(item: HierarchicalItem): boolean {
            return item.children && Object.keys(item.children).length > 0;
        },
        openItem(item: HierarchicalItem & { selected?: boolean }) {
            if (this.hasChildren(item)) {
                this.breadCrumbs.push(item);
                this.currentItems = item.children;
            }
            if (this.isSelectable(item)) {
                item.selected = !item.selected;
                this.$emit("item-selected", { selected: item.selected, item });
            }
        },
        backToTop() {
            this.currentItems = this.rootItems;
            this.breadCrumbs = [];
        },
        goToBreadCrumb(breadCrumb: HierarchicalItem) {
            const index = this.breadCrumbs.findIndex(b => b.id === breadCrumb.id);
            this.breadCrumbs = this.breadCrumbs.slice(0, index + 1);
            this.currentItems = breadCrumb.children;
        }
    },
});
</script>

<style>

</style>