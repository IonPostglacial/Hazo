<template>
    <div class="scroll white-background medium-padding">
        In our items list, <a href="#taxa">{{stats.taxa.length}} taxa</a> were registered in our database, 
        <a href="#families">{{stats.families.length}} families</a>, {{stats.gender}} genus, 
        <a href="#species">{{stats.species.length}} species</a>. Among those, ** trees, and *** shrubs, and ** herbs; ** dans dry forest, ** live in savanna, ** aquatic plants.
        In the description list, {{chars.length}} characters were noted, in *** groups, with {{statesCount}} states, the *** description, *** description, and *** description were the three character the most applied in this database. And the fact that integrating the family and vernacular name into description, helping users reach their aiming plant efficiently. 
        {{picsCount}} pictures are stored in total. In our platform, **% plants are applied by human, ** plants are used for construction and ** are eatable, that present a great use for local people and for ethnobotanic researchers.<br>
        <h2 id="taxa">Taxa</h2>
        <ol>
            <li v-for="t in stats.taxa" :key="t.id">{{ t.name.S }}</li>
        </ol>
        <h2 id="families">Families</h2>
        <ol>
            <li v-for="t in stats.families" :key="t.id">{{ t.name.S }}</li>
        </ol>
        <h2 id="species">Species</h2>
        <input type="button" value="select table" @click="selectSpeciesTable">
        <table ref="speciestable">
            <tr>
                <td><b>N°</b></td>
                <td><b>Family</b></td>
                <td><b>Scientific Name</b></td>
                <td><b>Vernacular Name</b></td>
            </tr>
            <tr v-for="(t, i) in stats.species" :key="t.id">
                <td><span>{{i+1}}</span></td>
                <td><span>{{ getFamilyName(t) }}</span></td>
                <td><i>{{ t.name.S }}</i><span>&nbsp;{{ t.author }}</span></td>
                <td><span>{{ t.name.V }}</span></td>
            </tr>
        </table>
    </div>
</template>

<script lang="ts">
import { taxonsStats } from "@/features";
import { Taxon, Dataset, iterHierarchy } from "@/datatypes";

export default {
    data() {
        const dataset = Hazo.store.dataset;
        const stats = taxonsStats(dataset.taxonsHierarchy);
        const chars = Array.from(iterHierarchy(dataset.charactersHierarchy));
        let statesCount = 0;
        let picsCount = 0;
        for (const char of chars) {
            picsCount += char.pictures.length;
            if (char.characterType === "discrete") {
                statesCount += char.states.length;
                for (const state of char.states) {
                    picsCount += state.pictures.length;
                }
            }
        }
        for (const taxon of iterHierarchy(dataset.taxonsHierarchy)) {
            picsCount += taxon.pictures.length;
        }
        return {
            store: Hazo.store,
            stats,
            chars,
            statesCount,
            picsCount
        };
    },
    computed: {
        dataset(): Dataset {
            return this.store.dataset as Dataset;
        },
    },
    methods: {
        getFamilyName(t: Taxon|undefined): string {
            var family = t;
            while (typeof family?.parentId !== "undefined") {
                family = this.dataset.taxon(family.parentId);
            }
            return family?.name.S ?? "";
        },
        selectSpeciesTable() {
            var range, sel, el = this.$refs.speciestable as Node;
            if (document.createRange && window.getSelection) {
                range = document.createRange();
                sel = window.getSelection();
                if (sel === null) return;
                sel.removeAllRanges();
                try {
                    range.selectNodeContents(el);
                    sel.addRange(range);
                } catch (e) {
                    range.selectNode(el);
                    sel.addRange(range);
                }
            }
        }
    }
};
</script>