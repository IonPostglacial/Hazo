<template>
    <div class="horizontal-flexbox start-align flex-grow-1">
        <nav v-if="showLeftMenu" class="scroll thin-border white-background no-print">
            <TreeMenu :editable="false" :items="taxonsHierarchy" :selected-item="selectedTaxon ? selectedTaxon.id : ''" 
                :name-fields="[{ label: 'NS', propertyName: 'name' }, { label: 'NV', propertyName: 'vernacularName'}, { label: '中文名', propertyName: 'nameCN' }]"
                @select-item="selectTaxon">
            </TreeMenu>
        </nav>
        <div v-if="typeof selectedTaxon !== 'undefined'" class="scroll flex-grow-1">
            <article style="max-width: 100ch" class="centered white-background medium-padding">
                <div class="no-print horizontal-flexbox">
                    <label v-for="parent in hierarchy" :key="parent.id"><input type="checkbox" v-model="isParentSelected[parent.id]" checked>{{ parent.name }}</label>
                </div>
                <h1><div v-for="parent in hierarchyToDisplay" :key="parent.id">{{ parent.name }}</div></h1>
                <section v-for="taxon in itemsToDisplay" :key="taxon.id" class="page-break">
                    <h2><i>{{ taxon.name }}</i> {{ taxon.author }}</h2>
                    <section v-for="description in descriptions(taxon)" :key="description.character.id" class="horizontal-flexbox space-between limited-width">
                        <div class="horizontal-flexbox small-height">
                            <div v-for="state in description.states" :key="'img-' + state.id" class="horizontal-flexbox">
                                <img v-for="photo in state.photos" class="small-height medium-max-width thin-border" :key="photo.id" :src="photo.url">
                            </div>
                        </div>
                        <div class="horizontal-flexbox">
                            <div>{{ description.character.name }}<span class="spaced">is</span></div>
                            <div v-for="(state, index) in description.states" :key="state.id">
                                <span v-if="index > 0" class="spaced">or</span> {{ state.name }}
                            </div>
                        </div>
                    </section>
                    <hr class="no-print">
                </section>
            </article>
        </div>
    </div>
</template>
<script lang="ts">
import { Character, Description, Hierarchy, Taxon } from '@/bunga'; // eslint-disable-line no-unused-vars
import { taxonDescriptions } from '@/bunga/Taxon';
import TreeMenu from "./TreeMenu.vue";
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "TaxonPresentation",
    components: { TreeMenu },
    props: {
        showLeftMenu: Boolean,
        selectedTaxon: Object as PropType<Taxon>,
        taxonsHierarchy: Object as PropType<Hierarchy<Taxon>>,
        characters: Object as PropType<Iterable<Character>>,
    },
    data() {
        return {
            isParentSelected: {} as Record<string, boolean>,
        }
    },
    computed: {
        itemsToDisplay(): Iterable<Taxon> {
            return this.taxonsHierarchy.getLeaves(this.selectedTaxon);
        },
        hierarchyToDisplay(): Taxon[] {
            return this.hierarchy.filter(parent => this.isParentSelected[parent.id]);
        },
        hierarchy(): Taxon[] {
            const hierarchy: Taxon[] = [];
            let it: Taxon|undefined = this.selectedTaxon;

            while(typeof it?.parentId !== "undefined") {
                const parent = this.taxonsHierarchy.itemWithId(it.parentId);
                hierarchy.unshift(parent!);
                it = parent;
            }
            hierarchy.forEach(parent =>  {
                if (typeof this.isParentSelected[parent.id] === "undefined")
                    Vue.set(this.isParentSelected, parent.id, true);
            });
            return hierarchy;
        },
    },
    methods: {
        exitPresentation() {
            this.$emit("exit");
        },
        selectTaxon(id: string) {
            this.$emit("taxon-selected", id);
        },
        descriptions(taxon: Taxon): Description[] {
            return taxonDescriptions(taxon, this.characters);
        },
    }
})
</script>