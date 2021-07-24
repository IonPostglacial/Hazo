<template>
    <div class="scroll flex-grow-1">
        <article style="max-width: 100ch" class="centered white-background medium-padding">
            <section v-for="taxon in itemsToDisplay" :key="taxon.id" class="page-break">
                <h2><i>{{ taxon.name.S }}</i> {{ taxon.author }}</h2>
                <div class="horizontal-flexbox">
                    <div class="flex-grow-1">
                        <div>
                            <div>Synonymous <span>{{ taxon.name2 }}</span></div>
                            <div>中文名 <span>{{ taxon.name.CN }}</span></div>
                            <div>NV <span>{{ taxon.name.V }}</span></div>
                            <div>NV 2 <span>{{ taxon.vernacularName2 }}</span></div>
                            <div>Website <a target="_blank" :href="taxon.website">{{ taxon.website }}</a></div>
                        </div>
                        <section v-for="description in descriptions(taxon)" :key="description.character.id" class="horizontal-flexbox space-between limited-width">
                            <div class="horizontal-flexbox small-height">
                                <div v-for="state in description.states" :key="'img-' + state.id" class="horizontal-flexbox">
                                    <img v-for="photo in state.pictures" class="small-height medium-max-width thin-border" :key="photo.id" :src="photo.url">
                                </div>
                            </div>
                            <flowering v-if="description.character.preset == 'flowering'" :value="monthsFromStates(description.states)">
                            </flowering>
                            <div v-if="description.character.preset != 'flowering'" class="horizontal-flexbox">
                                <div>{{ description.character.name.S }}<span class="spaced">is</span></div>
                                <div v-for="(state, index) in description.states" :key="state.id">
                                    <span v-if="index > 0" class="spaced">or</span> {{ state.name.S }}
                                </div>
                            </div>
                        </section>
                    </div>
                    <img v-if="taxon.pictures[0]" class="medium-max-width fit-contain" :src="taxon.pictures[0].url"/>
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
import { defineComponent, PropType } from "vue"; // eslint-disable-line no-unused-vars
import Flowering from "./Flowering.vue";

export default defineComponent({
    name: "TaxonPresentation",
    components: { Flowering },
    props: {
        showLeftMenu: Boolean,
        selectedTaxonId: String,
        dataset: Object as PropType<Dataset>,
    },
    data() {
        return {
            isParentSelected: {} as Record<string, boolean>,
        }
    },
    computed: {
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
        descriptions(taxon: Taxon): Iterable<Description> {
            return this.dataset.taxonDescriptions(taxon);
        },
        monthsFromStates(states: State[]): number {
            return Months.fromStates(states);
        },
    }
})
</script>