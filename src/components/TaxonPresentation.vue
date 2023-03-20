<template>
    <div class="scroll flex-grow-1">
        <div class="horizontal-flexbox no-print">
            <router-link class="button" :to="'/taxons/' + selectedTaxonId">Back to Taxon</router-link>
            <select v-model="lang">
                <option value="S">Scientific</option>
                <option value="CN">Chinese</option>
            </select>
             <button type="button" class="background-color-1" @click="print">Print</button>
        </div>
        <article style="max-width: 100ch" class="centered white-background medium-padding">
            <section v-for="taxon in itemsToDisplay" :key="taxon.id" class="page-break">
                <h2 class="horizontal-flexbox space-between">
                    <div><i>{{ taxon.name.S }}</i> {{ taxon.author }}</div>
                    <div v-if="taxon.children.length !== 0">subtaxa: {{ taxon.children.length }}</div></h2>
                <div class="horizontal-flexbox">
                    <div class="flex-grow-1">
                        <div>
                            <div>Synonymous <span>{{ taxon.name2 }}</span></div>
                            <div>中文名 <span>{{ taxon.name.CN }}</span></div>
                            <div>NV <span>{{ taxon.name.V }}</span></div>
                            <div>NV 2 <span>{{ taxon.vernacularName2 }}</span></div>
                            <div style="max-width: 50ch" class="text-ellipsed">Website <a target="_blank" :href="taxon.website">{{ taxon.website }}</a></div>
                        </div>
                        <section v-for="description in descriptions(taxon)" :key="description.character.id" class="horizontal-flexbox limited-width">
                            <div class="horizontal-flexbox small-height">
                                <div v-for="state in description.states" :key="'img-' + state.id" class="horizontal-flexbox">
                                    <img v-for="photo in state.pictures" class="small-height medium-max-width thin-border" :key="photo.id" :src="pictureUrl(photo)">
                                </div>
                            </div>
                            <flowering v-if="isFlowering(description)" :model-value="monthsFromStates(description.states)">
                            </flowering>
                            <div v-if="!isFlowering(description)" class="horizontal-flexbox">
                                <div>{{ charName(description.character) }}<span class="spaced">:</span></div>
                                <div v-for="(state, index) in description.states" :key="state.id">
                                    <span v-if="index > 0" class="spaced">/</span> {{ stateName(state) }}
                                </div>
                            </div>
                        </section>
                    </div>
                    <PictureGalery :images="taxon.pictures" class="medium-max-width medium-max-height fit-contain">
                    </PictureGalery>
                </div>
                <hr class="no-print">
            </section>
        </article>
    </div>
</template>
<script lang="ts">
import { Dataset, Description, Taxon, taxonDescriptions } from '@/datatypes'; // eslint-disable-line no-unused-vars
import { forEachLeaves, Hierarchy, iterHierarchy } from '@/datatypes/hierarchy';
import Months from '@/datatypes/Months';
import { Character, State } from '@/datatypes/types';
import Flowering from "@/components/Flowering.vue";
import PictureGalery from "@/components/PictureGalery.vue";


export default {
    name: "TaxonPresentation",
    components: { Flowering, PictureGalery },
    data() {
        return {
            isParentSelected: {} as Record<string, boolean>,
            store: Hazo.store,
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
        dataset(): Dataset {
            return this.store.dataset as Dataset;
        },
        selectedTaxon(): Taxon|undefined {
            return this.dataset.taxon(this.selectedTaxonId);
        },
        itemsToDisplay(): Iterable<Taxon> {
            if (this.selectedTaxon) {
                return iterHierarchy(this.selectedTaxon);
            } else {
                const items: Taxon[] = [];
                forEachLeaves(this.dataset.taxonsHierarchy, t => {
                    items.push(t);
                });
                return items;
            }
        },
    },
    methods: {
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
        descriptions(taxon: Taxon): Description[] {
            return taxonDescriptions(this.dataset, taxon);
        },
        monthsFromStates(states: {id: string}[]): number {
            return Months.fromStates(states);
        },
    }
}
</script>