<template>
    <div class="vertical-flexbox relative scroll">
        <v-card outlined class="stick-to-top">
            <v-sheet class="pa-2">
                <v-text-field
                    v-model="menuFilter"
                    label="Search"
                    dense
                    flat
                    hide-details
                    solo-inverted
                    clearable
                    clear-icon="mdi-close-circle-outline">
                </v-text-field>
                <v-toolbar flat>
                    <v-btn icon @click="backToTop"><v-icon>mdi-folder</v-icon></v-btn>
                    <div class="display-contents" v-for="breadCrumb in breadCrumbs" :key="breadCrumb.id">
                        <v-icon>mdi-chevron-right</v-icon>
                        <v-btn depressed  @click="goToBreadCrumb(breadCrumb)">{{ breadCrumb.name.S }}</v-btn>
                    </div>
                </v-toolbar>
            </v-sheet>
        </v-card>
        <div v-if="!floweringMode" class="horizontal-flexbox flex-wrap relative">
            <v-card width="200" elevation="2" class="ma-2" outlined v-for="item in itemsToDisplay" :key="item.id" @click="openItem(item)">
                <v-img height="200" :src="item.pictures.length > 0 ? item.pictures[0].url : ''" 
              class="white--text align-end"
              gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)">
                    <v-card-title class="d-flex flex-column">
                        <div class="text-no-wrap" v-for="field in nameFieldsForItem(item)" :key="field" :title="item.name[field]">
                            {{ item.name[field] }}
                        </div>
                    </v-card-title>
                </v-img>
                <v-card-actions>
                    <v-btn v-if="item.parentId && hasChildren(item)" @click.stop="selectWithoutOpening(item)">no more precision</v-btn>
                </v-card-actions>
            </v-card>
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
import makeid from "@/tools/makeid";
import { DiscreteCharacter } from "@/datatypes/types";
type ItemType = HierarchicalItem & { selected?: boolean };

export default Vue.extend({
    name: "SquareTreeViewer",
    components: { Flowering },
    props: {
        editable: Boolean,
        rootItems: Object as PropType<Hierarchy<ItemType>>,
        nameFields: Array as PropType<string[]>,
    },
    data() {
        const currentItems = [...this.rootItems!.children];
        return {
            flowering: Months.fromStates(currentItems.filter(item => item.selected)),
            floweringMode: false,
            isRoot: true,
            currentItems: currentItems,
            breadCrumbs: [] as Hierarchy<ItemType>[],
            menuFilter: "",
        }
    },
    watch: {
        rootItems(newRootItems: Hierarchy<ItemType>) {
            if (this.breadCrumbs.length - 1 < 0) return;
            const currentlyOpenItem = this.breadCrumbs[this.breadCrumbs.length - 1];
            if (typeof currentlyOpenItem !== "undefined") {
                this.floweringMode = this.isFlowering(currentlyOpenItem);
                this.currentItems = [...currentlyOpenItem.children];
                this.flowering = Months.fromStates(this.currentItems.filter(item => item.selected));
            }
        },
        currentItems(items: Hierarchy<ItemType>[]) {
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
        isClickable(item: Hierarchy<ItemType>): boolean {
            return this.hasChildren(item) || this.isSelectable(item);
        },
        isSelected(item: Hierarchy<ItemType> & { selected?: boolean }): boolean {
            return item.selected ?? false;
        },
        isSelectable(item: Hierarchy<ItemType> & { selected?: boolean }): boolean {
            return this.editable && item.children.length === 0;
        },
        hasChildren(item: Hierarchy<ItemType>): boolean {
            return item.children.length > 0;
        },
        isFlowering(item: Hierarchy<ItemType>): boolean {
            return item.type === "character" &&
                    (item as Character).characterType === "discrete" &&
                    (item as DiscreteCharacter).preset === "flowering"
        },
        openItem(item: Hierarchy<ItemType> & { selected?: boolean }) {
            this.isRoot = false;
            this.floweringMode = this.isFlowering(item);
            if (item.children.length > 0) {
                this.breadCrumbs.push(item);
                this.currentItems = [...item.children];
                this.$emit("item-open", { item });
            }
            if (this.isSelectable(item)) {
                this.$emit("item-selection-toggled", { item });
            }
        },
        selectWithoutOpening(character: Character & { selected?: boolean }) {
            const ch = Hazo.store.dataset.character(character.id);
            let inherentState = ch?.characterType === "range" ? undefined : ch?.inherentState;
            if (typeof inherentState === "undefined") {
                const parentCharacter = Hazo.store.dataset.character(character.parentId);
                if (typeof parentCharacter !== "undefined") {
                    inherentState = { id: "s" + makeid(8), name: clone(character.name), pictures: [] };
                    Hazo.store.do("addState", { state: inherentState, character: parentCharacter });
                    Hazo.store.do("setInherentState", { state: inherentState, character });
                }
            }
            this.$emit("item-selection-toggled", { item: inherentState });
        },
        monthToggled(monthIndex: number) {
            this.$emit("item-selection-toggled", { item: Months.floweringStates[monthIndex] });
        },
        backToTop() {
            this.isRoot = true;
            this.floweringMode = false;
            this.currentItems = [...this.rootItems!.children];
            this.breadCrumbs = [];
        },
        goToBreadCrumb(breadCrumb: Hierarchy<ItemType>) {
            const index = this.breadCrumbs.findIndex(b => b.id === breadCrumb.id);
            this.breadCrumbs = this.breadCrumbs.slice(0, index + 1);
            this.currentItems = [...breadCrumb.children];
        }
    },
});
</script>