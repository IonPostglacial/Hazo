<template>
    <VBox class="white-background thin-border medium-padding min-width-m centered scroll">
        <VBox class="stick-to-top white-background full-width">
            <HBox class="centered">
                <select v-model="lang">
                    <option value="S">NS</option>
                    <option value="V">NV</option>
                    <option value="CN">中文名</option>
                </select>
                <input type="search" v-model="search" />
            </HBox>
        </VBox>
        <table>
            <tr>
                <th v-for="lang in languages" :key="lang">{{ lang }}</th><th></th>
            </tr>
            <tr v-for="entry in families" :key="entry.id">
                <td v-for="lang in languages" :key="lang">{{ entry[lang] }}</td><td><div class="close" @click="deleteEntry(entry.id)"></div></td>
            </tr>
        </table>
    </VBox>
</template>

<script lang="ts">
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import { familiesWithNamesLike, Name, LANGUAGES, deleteFamily } from "@/db-index";

export default {
    components: { HBox, VBox },
    data() {
        return {
            languages: LANGUAGES,
            families: [] as Name[],
            lang: "S" as const,
            search: ""
        };
    },
    methods: {
        updateFamilies() {
            familiesWithNamesLike(this.lang, this.search).then(f => this.families = f);
        },
        deleteEntry(id: string) {
            deleteFamily(id);
            this.updateFamilies();
        },
    },
    watch: {
        search(_) {
            this.updateFamilies();
        }
    },
    mounted() {
        this.updateFamilies();
    }
};
</script>