<template>
    <div class="scroll flex-grow-1">
        <div class="horizontal-flexbox no-print">
            <router-link class="button" :to="'/taxons/' + this.selectedTaxonId">Back to Taxon</router-link>
             <button type="button" class="background-color-1" @click="print">Print</button>
        </div>
        <article style="max-width: 100ch" class="centered white-background medium-padding">
            <section v-for="taxon in itemsToDisplay" :key="taxon.id" class="page-break">
                <h2 class="horizontal-flexbox space-between">
                    <div><i>{{ taxon.name.S }}</i> {{ taxon.author }}</div>
                    <div v-if="numberOfChildren(taxon) !== 0">subtaxa: {{ numberOfChildren(taxon) }}</div></h2>
                <div class="horizontal-flexbox">
                    <div class="flex-grow-1">
                        <div>
                            <div>Synonymous <span>{{ taxon.name2 }}</span></div>
                            <div>中文名 <span>{{ taxon.name.CN }}</span></div>
                            <div>NV <span>{{ taxon.name.V }}</span></div>
                            <div>NV 2 <span>{{ taxon.vernacularName2 }}</span></div>
                            <div>Website <a target="_blank" :href="taxon.website">{{ taxon.website }}</a></div>
                        </div>
                        <section v-for="description in descriptions(taxon)" :key="description.character.id" class="horizontal-flexbox limited-width">
                            <div class="horizontal-flexbox small-height">
                                <div v-for="state in description.states" :key="'img-' + state.id" class="horizontal-flexbox">
                                    <img v-for="photo in state.pictures" class="small-height medium-max-width thin-border" :key="photo.id" :src="pictureUrl(photo)">
                                </div>
                            </div>
                            <flowering v-if="description.character.preset == 'flowering'" :value="monthsFromStates(description.states)">
                            </flowering>
                            <div v-if="description.character.preset != 'flowering'" class="horizontal-flexbox">
                                <div>{{ description.character.name.S }}<span class="spaced">:</span></div>
                                <div v-for="(state, index) in description.states" :key="state.id">
                                    <span v-if="index > 0" class="spaced">/</span> {{ state.name.S }}
                                </div>
                            </div>
                        </section>
                    </div>
                    <img v-if="taxon.pictures[0]" class="medium-max-width medium-max-height fit-contain" :src="pictureUrl(taxon.pictures[0])"/>
                </div>
                <hr class="no-print">
            </section>
        </article>
    </div>
</template>
<script lang="ts">
import { Dataset, Description, Taxon } from '@/datatypes'; // eslint-disable-line no-unused-vars
import Months from '@/datatypes/Months';
import { State } from '@/datatypes/types';
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import Flowering from "./Flowering.vue";

export default Vue.extend({
    name: "TaxonPresentation",
    components: { Flowering },
    data() {
        return {
            isParentSelected: {} as Record<string, boolean>,
            store: Hazo.store,
            selectedTaxonId: this.$route.params.id ?? "",
        }
    },
    watch: {
        $route(to: any) {
            this.selectedTaxonId = to.params.id;
        },
    },
    computed: {
        dataset(): Dataset {
            return this.store.dataset;
        },
        selectedTaxon(): Taxon|undefined {
            return this.dataset.taxonsHierarchy?.itemWithId(this.selectedTaxonId);
        },
        itemsToDisplay(): Iterable<Taxon> {
            if (typeof this.selectedTaxon !== "undefined") {
                return this.dataset.taxonsHierarchy?.getLeaves(this.selectedTaxon);
            } else {
                return this.dataset.taxonsHierarchy?.allItems;
            }
        },
    },
    methods: {
        pictureUrl(item: { url: string, hubUrl: string }): string {
            if (item.hubUrl) {
                return item.hubUrl; 
            } else {
                return item.url;
            }
        },
        print() {
            window.print();
        },
        numberOfChildren(taxon: Taxon): number {
            return this.dataset.taxonsHierarchy.numberOfChildren(taxon);
        },
        descriptions(taxon: Taxon): Iterable<Description> {
            return this.dataset.taxonDescriptions(taxon);
        },
        monthsFromStates(states: State[]): number {
            return Months.fromStates(states);
        },
    }
})
</script>