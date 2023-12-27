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
            <SquareCard v-for="item in itemsToDisplay" :key="item.id" :clickable="isClickable(item)"
                    :image="item.pictures.length > 0 ? item.pictures[0].url : undefined"
                    @click="openItem(item)">
                <template v-slot:background>
                    <Flowering v-if="isFlowering(item)" :model-value="monthsFromItem(item)"></Flowering>
                </template>
                <div class="display-contents">
                    <div v-for="field in nameFieldsForItem(item)" :key="field"
                            :title="item.name[field]"
                            :class="['text-ellipsed', 'round-sides', isSelected(item) ? 'background-color-1' : 'glass-background']">
                        {{ item.name[field] }}
                    </div>
                </div>
                <button v-if="hasChildren(item)" @click.stop="selectWithoutOpening(item as HierarchicalItem)" class="thin-border medium-padding text-ellipsed white-background">no more precision</button>
            </SquareCard>
        </HBox>
        <div v-if="floweringMode">
            <Flowering v-model="flowering" @month-selected="monthToggled" @month-unselected="monthToggled" class="limited-width"></Flowering>
        </div>
    </VBox>
</template>

<script lang="ts">
import { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Hierarchy, HierarchicalItem } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Flowering, { Track } from "./Flowering.vue";
import GeoView from "./GeoView.vue";
import SquareCard from "./toolkit/SquareCard.vue";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import { Character } from "@/datatypes";
import Months from "@/datatypes/Months";
import clone from "@/tools/clone";
import makeid from "@/tools/makeid";
import { DiscreteCharacter, BasicInfo, MultilangText } from "@/datatypes/types";
import { mapActions } from "pinia";
import { useDatasetStore } from "@/stores/dataset";


function floweringFromStates(color: string, currentItems: 
    {
        id: string;
        name: MultilangText;
    }[]) {
    return [{
        name: "",
        color,
        data: Months.fromStates(currentItems),
    }]
}

export default {
    name: "SquareTreeViewer",
    components: { Flowering, GeoView, HBox, SquareCard, VBox },
    props: {
        selectedItems: Object as PropType<string[]>,
        rootItems: Object as PropType<Hierarchy<BasicInfo>>,
        nameFields: Array as PropType<string[]>,
    },
    data() {
        const currentItems = [...this.rootItems!.children];
        return {
            isRoot: true,
            currentItems: currentItems,
            breadCrumbs: [] as Hierarchy<BasicInfo>[],
            menuFilter: "",
        };
    },
    watch: {
        rootItems(newRootItems: Hierarchy<BasicInfo>) {
            let currentlyOpenItem = newRootItems;
            for (const breadCrumb of this.breadCrumbs) {
                const it = currentlyOpenItem.children.find(it => it.id === breadCrumb.id);
                if (typeof it === "undefined") return;
                currentlyOpenItem = it;
            }
            if (typeof currentlyOpenItem !== "undefined") {
                this.currentItems = [...currentlyOpenItem.children];
            }
        },
    },
    computed: {
        floweringMode(): boolean {
            if (this.currentCharacter) {
                return this.isFlowering(this.currentCharacter);
            }
            return false;
        },
        flowering(): Track[] {
            return this.flowering = floweringFromStates(this.currentCharacter?.color ?? "#84bf3d", this.currentItems.filter(item => this.isSelected(item)));
        },
        currentCharacter(): DiscreteCharacter|undefined {
            if (this.breadCrumbs.length === 0) {
                if (this.rootItems?.type === "character") {
                    const ch = this.rootItems as DiscreteCharacter;
                    if (typeof ch === "undefined" || ch.characterType !== "discrete") { return undefined; }
                    return ch;
                }
                return undefined;
            } else {
                const character = this.breadCrumbs[this.breadCrumbs.length - 1];
                const ch = this.characterWithId(character.id);
                if (typeof ch === "undefined" || ch.characterType !== "discrete") { return undefined; }
                return ch;
            }
        },
        itemsToDisplay(): Iterable<Hierarchy<BasicInfo>> {
            if (!this.currentItems) return [];
            const shouldDisplayItem = (item: BasicInfo) => {
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
        ...mapActions(useDatasetStore, ["addState", "characterWithId"]),
        monthsFromItem(_item: Hierarchy<BasicInfo>): Track[] {
            return [];
        },
        nameFieldsForItem(item: any): Iterable<string> {
            return this.nameFields?.filter(field => typeof item.name[field] !== "undefined" && item.name[field] !== null && item.name[field] !== "") ?? [];
        },
        isClickable(item: Hierarchy<BasicInfo>): boolean {
            return this.hasChildren(item) || this.isSelectable(item);
        },
        isSelected(item: Hierarchy<BasicInfo>): boolean {
            if ((item as any)?.type === "character") {
                const ch = item as Character;
                if (ch.characterType === "discrete" && typeof ch.inherentState !== "undefined") {
                    return this.selectedItems?.includes(ch.inherentState.id) ?? false;
                } else {
                    return false;
                }
            }
            return this.selectedItems?.includes(item.id) ?? false;
        },
        isSelectable(item: Hierarchy<BasicInfo>): boolean {
            return item.children.length === 0;
        },
        hasChildren(item: Hierarchy<BasicInfo>): boolean {
            return item.children.length > 0;
        },
        isFlowering(item: Hierarchy<BasicInfo>): boolean {
            return (item as HierarchicalItem).type === "character" &&
                    (item as Character).characterType === "discrete" &&
                    (item as DiscreteCharacter).preset === "flowering"
        },
        isGeographic(item: Hierarchy<BasicInfo>): boolean {
            return (item as HierarchicalItem).type === "character" &&
                    (item as Character).characterType === "discrete" &&
                    (item as DiscreteCharacter).preset === "map"
        },
        openItem(item: Hierarchy<BasicInfo>) {
            this.isRoot = false;
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
            const ch = this.characterWithId(character.id);
            let inherentState = ch?.characterType === "range" ? undefined : ch?.inherentState;
            if (typeof inherentState === "undefined") {
                const parentCharacter = this.characterWithId(character.parentId);
                if (typeof parentCharacter !== "undefined" && parentCharacter.characterType === "discrete") {
                    inherentState = { id: "s" + makeid(8), type: "state", name: clone(character.name), pictures: [] };
                    this.addState({ state: inherentState, character: parentCharacter });
                    this.setInherentState({ state: inherentState, character });
                }
            }
            this.$emit("item-selection-toggled", { item: inherentState });
        },
        monthToggled(monthIndex: number) {
            const character = this.breadCrumbs[this.breadCrumbs.length - 1];
            const ch = this.characterWithId(character.id);
            if (typeof ch === "undefined" || ch.characterType !== "discrete") { return; }
            this.$emit("item-selection-toggled", { item: ch.states[monthIndex] });
        },
        backToTop() {
            this.isRoot = true;
            this.currentItems = [...this.rootItems!.children];
            this.breadCrumbs = [];
        },
        goToBreadCrumb(breadCrumb: Hierarchy<BasicInfo>) {
            const index = this.breadCrumbs.findIndex(b => b.id === breadCrumb.id);
            this.breadCrumbs = this.breadCrumbs.slice(0, index + 1);
            this.currentItems = [...breadCrumb.children];
        }
    },
};
</script>