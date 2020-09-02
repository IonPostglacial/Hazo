<template>
    <div class="vertical-flexbox">
        <input class="flex-grow-1" type="search" v-model="menuFilter" placeholder="Filter" />
        <div class="horizontal-flexbox flex-wrap">
            <button v-if="currentItems !== rootItems" type="button" @click="backToTop">Top</button>
            <button v-for="breadCrumb in breadCrumbs" :key="breadCrumb.id" @click="goToBreadCrumb(breadCrumb)">{{ breadCrumb.name }}</button>
        </div>
        <div class="horizontal-flexbox flex-wrap relative">
            <button v-for="item in itemsToDisplay" :key="item.id" type="button" class="square-1-3 relative vertical-flexbox full-background"
                    :style="item.photos.length > 0 ? 'background-image: url(' + item.photos[0] + ')' : ''"
                    @click="openItem(item)">
                <div class="white-background thin-border">{{ item.name }}</div>
            </button>
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
        rootItems: Object as PropValidator<Record<string, HierarchicalItem>>,
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
                if (this.menuFilter !== "") {
                    return !item.hidden && item.name.toUpperCase().startsWith(this.menuFilter?.toUpperCase());
                } else {
                    return !item.hidden && (this.currentItems === this.rootItems ? item.topLevel : !item.topLevel);
                }
            });
        }
    },
    methods: {
        openItem(item: HierarchicalItem) {
            if (Object.keys(item.children).length > 0) {
                this.breadCrumbs.push(item);
                this.currentItems = item.children;
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