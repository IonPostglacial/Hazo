<template>
    <VBox>
        <VBox class="stick-to-top glass-background thin-border">
            <input class="flex-grow-1" type="search" v-model="menuFilter" placeholder="Filter" />
            <HBox v-if="breadCrumbs.length > 0">
                <div class="flex-wrap button-group">
                    <button type="button" @click="backToTop">Top</button>
                    <button v-for="breadCrumb in breadCrumbs" :key="breadCrumb.id" @click="goToBreadCrumb(breadCrumb)">{{ breadCrumb.name.S }}</button>
                </div>
                <Spacer></Spacer>
                <router-link class="button" :to="'/characters/' + breadCrumbs[breadCrumbs.length - 1].id">
                    <font-awesome-icon icon="fa-solid fa-edit" />
                </router-link>
            </HBox>
        </VBox>
        <SquareGrid v-if="!floweringMode && !isRange" class="square-grid relative">
            <SquareCard v-for="item in itemsToDisplay" :key="item.id" :clickable="isClickable(item)"
                    :image="item.pictures.length > 0 ? item.pictures[0].url : undefined"
                    :style="(isSelected(item) && 'color' in item) ? ('border:3px solid ' + item.color) : ''"
                    @click="openItem(item)">
                <template v-slot:background>
                    <Flowering v-if="item.pictures.length === 0 && isFlowering(item)" :model-value="monthsFromItem(item)"></Flowering>
                    <GeoView v-if="item.pictures.length === 0 && isGeographic(item)" :geo-map="mapModel(item)">
                    </GeoView>
                </template>
                <div class="display-contents">
                    <div v-for="field in nameFieldsForItem(item)" :key="field"
                            :title="item.name[field]"
                            :class="['text-ellipsed', 'round-sides', isSelected(item) ? 'background-color-1' : 'glass-background']">
                        {{ item.name[field] }}
                    </div>
                </div>
                <HBox>
                    <router-link v-if="item.type === 'character'" class="button" :to="'/characters/' + item.id">
                        <font-awesome-icon icon="fa-solid fa-edit" />
                    </router-link>
                </HBox>
            </SquareCard>
        </SquareGrid>
        <div v-if="floweringMode">
            <Flowering v-model="flowering" @month-selected="monthToggled" @month-unselected="monthToggled" class="limited-width"></Flowering>
        </div>
        <VBox v-if="isRange">
            <div v-if="isMetric && characterMeasurement">
                <ScaleComparator :measurement="characterMeasurement" height="400px"></ScaleComparator>
            </div>
            <div class="form-grid center-items">
                <label for="measurementMin">Min</label>
                <HBox class="center-items">
                    <input type="number" name="measurementMin" :value="minMeasurement" @change="updateMeasurement($event, false)" id="measurementMin">
                    <span v-if="characterUnit">{{ characterUnit.name.S }}</span>
                </HBox>
                <label for="measurementMax">Max</label>
                <HBox class="center-items">
                    <input type="number" name="measurementMax" :value="maxMeasurement" @change="updateMeasurement($event, true)" id="measurementMax">
                    <span v-if="characterUnit">{{ characterUnit.name.S }}</span>
                </HBox>
            </div>
        </VBox>
    </VBox>
</template>

<script lang="ts">
import { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Hierarchy, getCharacterMap, mapModel } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Flowering, { Track } from "./Flowering.vue";
import ScaleComparator from "./ScaleComparator.vue";
import GeoView from "./GeoView.vue";
import SquareCard from "./toolkit/SquareCard.vue";
import SquareGrid from "./toolkit/SquareGrid.vue";
import Spacer from "./toolkit/Spacer.vue";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import Months from "@/datatypes/Months";
import clone from "@/tools/clone";
import makeid from "@/tools/makeid";
import { Character, Item, Measurement, MultilangText, Unit } from "@/datatypes/types";
import { mapActions, mapWritableState } from "pinia";
import { useDatasetStore } from "@/stores/dataset";
import { getParentId, pathToItem } from "@/datatypes/Dataset";
import { fromNormalizedValue, toNormalizedValue } from "@/features/unit";
import { useHazoStore } from "@/stores/hazo";


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

const geographyNames = ["Geography", "Geographie", "Géographie", "地理分布"];

export default {
    name: "SquareTreeViewer",
    components: { Flowering, GeoView, HBox, ScaleComparator, Spacer, SquareCard, SquareGrid, VBox },
    props: {
        measurements: { required: true, type: Object as PropType<Partial<Record<string, Measurement>>> },
        selectedItems: Array<string>,
        rootItems: Object as PropType<Hierarchy<Item>>,
        nameFields: Array<string>,
    },
    data() {
        const currentItems = [...this.rootItems!.children];
        const breadCrumbs: Hierarchy<Item>[] = [...this.characterParentChain(this.rootItems), this.rootItems];
        return {
            isRoot: true,
            currentItems,
            breadCrumbs,
            menuFilter: "",
            value: 0,
        };
    },
    watch: {
        rootItems(newRootItems: Hierarchy<Item>) {
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
        ...mapWritableState(useHazoStore, ["selectedDescriptorId"]),
        floweringMode(): boolean {
            if (this.currentCharacter) {
                return this.isFlowering(this.currentCharacter);
            }
            return false;
        },
        flowering(): Track[] {
            return this.flowering = floweringFromStates(this.currentCharacter?.color ?? "#84bf3d", this.currentItems.filter(item => this.isSelected(item)));
        },
        currentCharacter(): Character|undefined {
            if (this.breadCrumbs.length === 0) {
                if (this.rootItems?.type === "character") {
                    const ch = this.rootItems;
                    return ch;
                }
                return undefined;
            } else {
                const character = this.breadCrumbs[this.breadCrumbs.length - 1];
                const ch = this.characterWithId(character.id);
                return ch;
            }
        },
        itemsToDisplay(): Iterable<Hierarchy<Item>> {
            if (!this.currentItems) return [];
            const shouldDisplayItem = (item: Hierarchy<Item>) => {
                if (this.menuFilter !== "") {
                    return this.anyChildNameStartsWith(item);
                } else {
                    return true;
                }
            };
            return this.currentItems.filter(shouldDisplayItem);
        },
        isRange(): boolean {
            return this.currentCharacter?.type === "character" && this.currentCharacter.characterType === "range";
        },
        isMetric(): boolean {
            return this.currentCharacter?.type === "character" && 
                this.currentCharacter.characterType === "range" && 
                (this.currentCharacter.unit?.name.S === "m" || 
                this.currentCharacter.unit?.name.S === "cm" ||
                this.currentCharacter.unit?.name.S === "mm");
        },
        characterUnit(): Unit | undefined {
            if (this.currentCharacter?.type === "character" && this.currentCharacter.characterType === "range") {
                return this.currentCharacter.unit;
            }
            return undefined
        },
        characterMeasurement(): Measurement | undefined {
            if (this.currentCharacter?.type === "character" && this.currentCharacter.characterType === "range") {
                return this.measurements[this.currentCharacter.id]
            }
            return undefined
        },
        minMeasurement(): number|undefined {
            const measurement = this.characterMeasurement;
            if (measurement) {
                return fromNormalizedValue(measurement.min, this.characterUnit);
            }
            return undefined;
        },
        maxMeasurement(): number|undefined {
            const measurement = this.characterMeasurement;
            if (measurement) {
                return fromNormalizedValue(measurement.max, this.characterUnit);
            }
            return undefined;
        },
    },
    methods: {
        ...mapActions(useDatasetStore, ["addState", "characterParentChain", "characterWithId"]),
        updateMeasurement(e: Event, isMax: boolean) {
            if (e.target instanceof HTMLInputElement && this.currentCharacter && this.currentCharacter.characterType === "range") {
                this.$emit("measurement-updated", { 
                    character: this.currentCharacter.id, 
                    measurement: { 
                        [isMax ? "max" : "min"]: toNormalizedValue(parseInt(e.target.value), this.characterUnit),
                        [isMax ? "min" : "max"]: (this.characterMeasurement ?? {})[isMax ? "min" : "max"],
                        character: this.currentCharacter,
                    }
                });
            }
        },
        anyChildNameStartsWith(item: Hierarchy<Item>): boolean {
            return item.name.S.toUpperCase().startsWith(this.menuFilter?.toUpperCase()) || 
                item.children.some((child: Hierarchy<Item>) => this.anyChildNameStartsWith(child));
        },
        monthsFromItem(_item: Hierarchy<Item>): Track[] {
            return [];
        },
        nameFieldsForItem(item: any): Iterable<string> {
            return this.nameFields?.filter(field => typeof item.name[field] !== "undefined" && item.name[field] !== null && item.name[field] !== "") ?? [];
        },
        isClickable(item: Hierarchy<Item>): boolean {
            return this.hasChildren(item) || this.isSelectable(item);
        },
        isSelected(item: Hierarchy<Item>): boolean {
            if (item?.type === "character") {
                if (item.characterType === "discrete" && typeof item.inherentState !== "undefined") {
                    return this.selectedItems?.includes(item.inherentState.id) ?? false;
                } else {
                    return false;
                }
            }
            return this.selectedItems?.includes(item.id) ?? false;
        },
        isSelectable(item: Hierarchy<Item>): boolean {
            return item.children.length === 0;
        },
        hasChildren(item: Hierarchy<Item>): boolean {
            return item.children.length > 0;
        },
        isFlowering(item: Hierarchy<Item>): boolean {
            return item.type === "character" &&
                item.characterType === "discrete" &&
                item.preset === "flowering"
        },
        isGeographic(item: Hierarchy<Item>): boolean {
            return item.type === "character" &&
                item.characterType === "discrete" &&
                (item.preset === "map" || geographyNames.includes(item.name.S))
        },
        mapModel(item: Hierarchy<Item>) {
            if (item.type === "character" && item.characterType === "discrete" && item.preset === "map") {
                return getCharacterMap(item);
            }
            return mapModel; 
        },
        openItem(item: Hierarchy<Item>) {
            this.isRoot = false;
            this.menuFilter = "";
            if (item.children.length > 0 || (item.type === "character" && item.characterType === "range")) {
                this.breadCrumbs.push(item);
                this.currentItems = [...item.children];
                this.$emit("item-open", { item });
            }
            if (this.isSelectable(item)) {
                this.$emit("item-selection-toggled", { item });
            }
        },
        selectWithoutOpening(character: Item) {
            if (character.type !== "character" || character.characterType !== "discrete") return;
            const ch = this.characterWithId(character.id);
            let inherentState = ch?.characterType === "range" ? undefined : ch?.inherentState;
            if (typeof inherentState === "undefined") {
                const parentCharacter = this.characterWithId(getParentId(character));
                if (typeof parentCharacter !== "undefined" && parentCharacter.characterType === "discrete") {
                    inherentState = { id: "s" + makeid(8), path: pathToItem(parentCharacter), type: "state", name: clone(character.name), detail: character.detail, pictures: [] };
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
            this.menuFilter = "";
            this.currentItems = [...this.rootItems!.children];
            this.breadCrumbs = [];
            this.selectedDescriptorId = "c0";
        },
        goToBreadCrumb(breadCrumb: Hierarchy<Item>) {
            this.menuFilter = "";
            const index = this.breadCrumbs.findIndex(b => b.id === breadCrumb.id);
            this.breadCrumbs = this.breadCrumbs.slice(0, index + 1);
            this.currentItems = [...breadCrumb.children];
            this.selectedDescriptorId = "c0";
        }
    },
};
</script>