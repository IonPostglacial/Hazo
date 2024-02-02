<template>
    <div class="scroll flex-grow-1">
        <HBox class="no-print stick-to-top glass-background thin-border">
            <router-link class="button" :to="'/taxons/' + selectedTaxonId">Back to Taxon</router-link>
            <select v-model="lang">
                <option value="S">Scientific</option>
                <option value="CN">Chinese</option>
            </select>
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
                        <VBox v-for="section in taxonDescriptionSections(taxon)">
                            <VBox v-for="description in section" :key="description.character.id" class="limited-width">
                                <div v-if="!isFlowering(description)">
                                    <h3>{{ charName(description.character) }}</h3>
                                    <HBox class="gap-1">
                                        <VBox v-for="state in description.states" :key="state.id" class="medium-padding thin-border">
                                            <img v-for="photo in state.pictures" class="fit-contain small-height medium-max-width thin-border" :key="photo.id" :src="pictureUrl(photo)">
                                            <span class="spaced">{{ stateName(state) }}</span>
                                        </VBox>
                                    </HBox>
                                </div>
                                <flowering v-if="isFlowering(description)" :model-value="tracksFromStates(description.states)">
                                </flowering>
                            </VBox>
                        </VBox>
                        <VBox>
                            <section v-for="measurement in taxon.measurements">
                                <MeasurementBox v-if="measurement" :measurement="measurement" lang-property="S">
                                </MeasurementBox>
                            </section>
                        </VBox>
                    </div>
                    <PictureGalery :images="taxon.pictures" class="medium-max-width medium-max-height fit-contain">
                    </PictureGalery>
                </HBox>
                <hr class="no-print">
            </section>
        </article>
    </div>
</template>
<script lang="ts">
import { Description, Taxon } from '@/datatypes';
import Months from '@/datatypes/Months';
import { Character, MultilangText, State } from '@/datatypes/types';
import Flowering, { Track } from "@/components/Flowering.vue";
import PictureGalery from "@/components/PictureGalery.vue";
import MeasurementBox from "@/components/MeasurementBox.vue";
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
    components: { Flowering, HBox, MeasurementBox, PictureGalery, Spacer, VBox, ScaleComparator },
    data() {
        return {
            isParentSelected: {} as Record<string, boolean>,
            lang: "S",
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
    },
    methods: {
        ...mapActions(useDatasetStore, ["taxonChildren", "taxonDescriptionSections", "taxonWithId"]),
        charName(ch: Character): string {
            const n:any = ch.name ?? {};
            return n[this.lang];
        },
        stateName(s: State): string {
            const n:any = s.name ?? {};
            return n[this.lang];
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
    }
}
</script>