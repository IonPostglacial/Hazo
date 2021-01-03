<template>
  <div class="horizontal-flexbox start-align flex-grow-1 no-vertical-overflow">
    <div class="vertical-flexbox">
        <div>Observations</div>
        <div class="scroll">
            <SquareTreeViewer class="large-max-width flex-grow-1" :name-fields="['name', 'nameEN', 'nameCN']" :editable="true" :rootItems="taxonCharactersTree" @item-selection-toggled="refineIdentification" @item-open="openCharacter">
            </SquareTreeViewer>
        </div>
    </div>
    <div class="veritcal-flexbox scroll">
        <div>Matching Taxons [{{ matchingTaxons.length }} / {{ allTaxons.length }}]</div>
        <ul class="flex-grow-1">
            <li v-for="taxon in matchingTaxons" :key="taxon.id">{{ taxon.name }}</li>
        </ul>
    </div>
  </div>
</template>

<script lang="ts">
import SquareTreeViewer from "./SquareTreeViewer.vue";
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Dataset } from "@/datatypes/Dataset"; // eslint-disable-line no-unused-vars
import { Taxon } from "@/datatypes/Taxon";
import { Hierarchy } from "@/datatypes/hierarchy"; // eslint-disable-line no-unused-vars
import { Character, State } from "@/datatypes"; // eslint-disable-line no-unused-vars
import { CharactersHierarchy } from "@/datatypes/CharactersHierarchy"; // eslint-disable-line no-unused-vars
import { ObservableMap } from "@/tools/observablemap";
import { ManyToManyBimap } from "@/tools/bimaps";
import { map } from "@/tools/iter";

export default Vue.extend({
    name: "IdentificationTab",
    components: { SquareTreeViewer },
    data() {
        const dataset = this.$store.state.dataset;
        const taxonToIdentify = new Taxon({ id: "t1", parentId: undefined, childrenIds: [] });
        const identificationDataset = new Dataset("", new Hierarchy<Taxon>("t", new ObservableMap()), dataset.charactersHierarchy, new ManyToManyBimap(ObservableMap), new Map(), []);
        identificationDataset.addTaxon(taxonToIdentify);
        return {
            identificationDataset: identificationDataset,
            taxonToIdentify: taxonToIdentify,
        }
    },
    computed: {
        charactersHierarchy(): CharactersHierarchy {
            return this.$store.state.dataset.charactersHierarchy;
        },
        taxonCharactersTree(): Hierarchy<any> {
            return this.identificationDataset.taxonCharactersTree(this.taxonToIdentify);
        },
        allTaxons(): Taxon[] {
            return Array.from(this.$store.state.dataset.taxonsHierarchy.allItems);
        },
        matchingTaxons(): Taxon[] {
            const researchDataset: Dataset = this.$store.state.dataset;
            const identifiedStates = this.identificationDataset.taxonStates(this.taxonToIdentify);
            if (identifiedStates.length > 0) {
                let allMatchingTaxonIds = Array.from(map(researchDataset.taxonsHierarchy.allItems, t => t.id));

                for (const state of identifiedStates) {
                    const character = researchDataset.charactersHierarchy.stateCharacter(state)!;
                    const matchingTaxonIds = researchDataset.statesByTaxons.getLeftIdsByRightId(state.id) ?? [];
                    allMatchingTaxonIds = allMatchingTaxonIds.filter(id =>
                        researchDataset.taxonStatesForCharacter({ id }, character).length === 0 ||
                                                                         matchingTaxonIds.includes(id));
                }
                return allMatchingTaxonIds.map(id => researchDataset.taxonsHierarchy.itemWithId(id)!);
            } else {
                return Array.from(researchDataset.taxonsHierarchy.allItems);
            }
        },
    },
    watch: {
        charactersHierarchy(oldValue, newValue) {
            this.identificationDataset.charactersHierarchy = newValue;
        },
    },
    methods: {
        refineIdentification(e: { item: State|Character }) {
            const isCharacter = (e.item as Character).type === "character";
            const stateToAdd = isCharacter ? (e.item as Character).inherentState : e.item as State;

            if (typeof stateToAdd !== "undefined") {
                const selected = !this.identificationDataset.hasTaxonState(this.taxonToIdentify, stateToAdd);
                if (selected) {
                    this.identificationDataset.statesByTaxons.add(this.taxonToIdentify.id, stateToAdd.id);
                } else {
                    this.identificationDataset.statesByTaxons.remove(this.taxonToIdentify.id, stateToAdd.id);
                }
            }
        },
        openCharacter(e: { item: Character }) {
            if (e.item.inherentState && !this.identificationDataset.hasTaxonState(this.taxonToIdentify, e.item.inherentState)) {
                this.refineIdentification({ item: e.item.inherentState });
            }
        },
    }
});
</script>
