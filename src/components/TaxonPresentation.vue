<template>
    <div class="scroll flex-grow-1">
        <HBox class="no-print stick-to-top glass-background thin-border">
            <router-link class="button" :to="'/taxons/' + selectedTaxonId">Back to Taxon</router-link>
            <MultiSelector :choices="langNames" v-model="langIds">
            </MultiSelector>
             <button type="button" class="background-color-1" @click="print">Print</button>
        </HBox>
        <article style="max-width: 100ch" class="centered white-background medium-padding">
            <section v-for="taxon in itemsToDisplay" :key="taxon.id" class="page-break">
                <h2 class="horizontal-flexbox">
                    <div><i>{{ taxon.name.S }}</i> {{ taxon.author }}</div>
                    <Spacer></Spacer>
                    <div v-if="taxon.children.length !== 0">subtaxa: {{ taxon.children.length }}</div>
                </h2>
                <HBox>
                    <div class="flex-grow-1">
                        <div class="form-grid center-items medium-padding">
                            <div>Synonymous <span>{{ taxon.name2 }}</span></div>
                            <div>中文名 <span>{{ taxon.name.CN }}</span></div>
                            <div>NV <span>{{ taxon.name.V }}</span></div>
                            <div>NV 2 <span>{{ taxon.vernacularName2 }}</span></div>
                            <div style="max-width: 50ch" class="text-ellipsed">Website <a target="_blank" :href="taxon.website">{{ taxon.website }}</a></div>
                        </div>
                        <VBox v-for="section in taxonDescriptionSections(taxon)" class="thin-border white-background medium-padding spaced-vertical">
                            <VBox v-for="description in section.descriptions" :key="description.character.id" class="limited-width">
                                <div v-if="'states' in description" class="display-contents">
                                    <h3>{{ charName(description.character) }}</h3>
                                    <HBox v-if="description.character.preset !== 'map'" class="gap-1">
                                        <HBox v-for="state in description.states" :key="state.id" class="medium-padding thin-border gap-1" :style="state.color ? ('background-color:' + state.color) : ''">
                                            <img v-for="photo in state.pictures" class="fit-contain small-height medium-max-width thin-border" :key="photo.id" :src="pictureUrl(photo)">
                                            <VBox>
                                                <div v-for="name in stateNames(state)" class="nowrap">
                                                    {{ name }}
                                                </div>
                                            </VBox>
                                        </HBox>
                                    </HBox>
                                    <GeoView v-if="description.character.preset === 'map'"
                                        :geo-map="getCharacterMap(description.character)"
                                        :selected-features="description.states.map(s => s.name.S)">
                                    </GeoView>
                                </div>
                                <MeasurementBox v-if="'min' in description" :measurement="description" :lang-properties="['S']">
                                </MeasurementBox>
                            </VBox>
                        </VBox>
                        <VBox v-if="calendarTracks(taxon).length > 0" class="rounded white-background medium-padding medium-margin thin-border">
                            <h2>Calendar</h2>
                            <ul>
                                <li v-for="track in calendarTracks(taxon)">
                                    <span :style="'color:' + track.color">{{ track.name }}</span>
                                </li>
                            </ul>
                            <Flowering
                                :model-value="calendarTracks(taxon)"
                                class="limited-width">
                            </Flowering>
                        </VBox>
                    </div>
                    <PictureGalery v-if="taxon.pictures.length > 0" :images="taxon.pictures" class="medium-max-width medium-max-height fit-contain">
                    </PictureGalery>
                </HBox>
                <hr class="no-print">
            </section>
        </article>
    </div>
</template>
<script lang="ts">
import { Description, Taxon, getCharacterMap } from '@/datatypes';
import Months from '@/datatypes/Months';
import { Character, MultilangText, State } from '@/datatypes/types';
import Flowering, { Track } from "@/components/Flowering.vue";
import MultiSelector from "./toolkit/MultiSelector.vue";
import PictureGalery from "@/components/PictureGalery.vue";
import MeasurementBox from "@/components/MeasurementBox.vue";
import GeoView from "@/components/GeoView.vue";
import HBox from './toolkit/HBox.vue';
import Spacer from './toolkit/Spacer.vue';
import { mapActions, mapState } from "pinia";
import { useDatasetStore } from "@/stores/dataset";
import VBox from './toolkit/VBox.vue';
import ScaleComparator from './ScaleComparator.vue';

function floweringFromStates(currentItems: 
    {
        id: string;
        name: MultilangText;
    }[]) {
    return [{
        name: "",
        color: "#84bf3d",
        data: Months.fromStates(currentItems),
    }]
}

export default {
    name: "TaxonPresentation",
    components: { Flowering, GeoView, HBox, MeasurementBox, MultiSelector, PictureGalery, Spacer, VBox, ScaleComparator },
    data() {
        return {
            isParentSelected: {} as Record<string, boolean>,
            langNames: ["FR", "CN", "EN"],
            langIds: [0],
            selectedTaxonId: (this.$route.params.id as string|undefined) ?? "",
        }
    },
    watch: {
        $route(to: any) {
            this.selectedTaxonId = to.params.id;
        },
    },
    computed: {
        ...mapState(useDatasetStore, ["leafTaxons"]),
        selectedTaxon(): Taxon|undefined {
            return this.taxonWithId(this.selectedTaxonId);
        },
        itemsToDisplay(): Iterable<Taxon> {
            if (this.selectedTaxon) {
                return this.taxonChildren(this.selectedTaxon);
            } else {
                return this.leafTaxons;
            }
        },
        langs(): string[] {
            return this.langIds.map(id => this.langNames[id]);
        }
    },
    methods: {
        ...mapActions(useDatasetStore, ["taxonChildren", "taxonDescriptionSections", "taxonWithId", "taxonCalendarTracks"]),
        charName(ch: Character): string {
            return this.langs.map(lang => this.getName(ch, lang)).join(" / ");
        },
        getCharacterMap,
        stateNames(s: State): string[] {
            return this.langs.map(lang => this.getName(s, lang));
        },
        getName(item: { name: MultilangText }, lang: string): string {
            const n:any = item.name ?? {};
            const name = n[lang];
            if (typeof name === "undefined" || name === "") {
                return n["S"] ?? "";
            }
            return name;
        },
        pictureUrl(item: { url: string, hubUrl: string|undefined }): string {
            if (item.hubUrl) {
                return item.hubUrl; 
            } else {
                return item.url;
            }
        },
        print() {
            window.print();
        },
        isFlowering(description: Description): boolean {
            const ch = description.character;
            return ch.characterType === "discrete" && ch.preset === "flowering";
        },
        tracksFromStates(states: { id: string, name: MultilangText }[]): Track[] {
            return floweringFromStates(states);
        },
        calendarTracks(taxon: Taxon|undefined): Track[] {
            if (typeof taxon === "undefined") {
                return [];
            }
            return this.taxonCalendarTracks(taxon);
        },
    }
}
</script>