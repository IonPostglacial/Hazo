<template>
    <div class="vertical-flexbox">
        <input class="flex-grow-1" type="search" v-model="menuFilter" placeholder="Filter" />
        <div class="horizontal-flexbox flex-wrap">
            <button v-if="currentItems !== rootItems" type="button" @click="backToTop">Top</button>
            <button v-for="breadCrumb in breadCrumbs" :key="breadCrumb.id" @click="goToBreadCrumb(breadCrumb)">{{ breadCrumb.name }}</button>
        </div>
        <div class="horizontal-flexbox flex-wrap relative">
            <component v-for="item in itemsToDisplay" :key="item.id" :is="isClickable(item) ? 'button' : 'div'" type="button" class="medium-square relative vertical-flexbox full-background thin-border white-background medium-padding medium-margin"
                    :style="item.photos.length > 0 ? 'background-image: url(' + item.photos[0] + ')' : ''"
                    @click="openItem(item)">
                <div :title="item.name" :class="'thin-border medium-padding text-ellipsed ' + (item.selected ? 'background-color-1' : 'white-background') + (isClickable(item) ? ' text-underlined' : '')">{{ item.name }}</div>
            </component>
        </div>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { HierarchicalItem } from "../bunga"; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "SquareTreeViewer",
    props: {
        editable: Boolean,
        rootItems: Object as PropType<Iterable<HierarchicalItem<any> & { selected?: boolean }>>,
    },
    data() {
        return {
            isRoot: true,
            currentItems: this.rootItems,
            breadCrumbs: [] as HierarchicalItem<any>[],
            menuFilter: "",
        }
    },
    computed: {
        itemsToDisplay(): Iterable<HierarchicalItem<any>> {
            console.log("display!");
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
            const currentItems = this.currentItems;
            return {
                *[Symbol.iterator]() {
                    for(const item of currentItems) {
                        if (shouldDisplayItem(item)) {
                            yield item;
                        }
                    }
                }
            }
        },
    },
    methods: {
        isClickable(item: HierarchicalItem<any>): boolean {
            return this.hasChildren(item) || this.isSelectable(item);
        },
        isSelectable(item: HierarchicalItem<any> & { selected?: boolean }): boolean {
            return this.editable && typeof item.selected !== "undefined";
        },
        hasChildren(item: HierarchicalItem<any>): boolean {
            return item.children && Object.keys(item.children).length > 0;
        },
        openItem(item: HierarchicalItem<any> & { selected?: boolean }) {
            this.isRoot = false;
            if (this.hasChildren(item)) {
                this.breadCrumbs.push(item);
                this.currentItems = Object.values(item.children);
            }
            if (this.isSelectable(item)) {
                item.selected = !item.selected;
                this.$emit("item-selected", { selected: item.selected, item });
            }
        },
        backToTop() {
            this.isRoot = true;
            this.currentItems = this.rootItems;
            this.breadCrumbs = [];
        },
        goToBreadCrumb(breadCrumb: HierarchicalItem<any>) {
            const index = this.breadCrumbs.findIndex(b => b.id === breadCrumb.id);
            this.breadCrumbs = this.breadCrumbs.slice(0, index + 1);
            this.currentItems = Object.values(breadCrumb.children);
        }
    },
});
</script>

<style>

</style>