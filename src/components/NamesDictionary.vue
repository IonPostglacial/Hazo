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
                <td v-for="lang in languages" :key="lang">{{ entry[lang] }}</td><td><div class="close" @click="deleteFamily(entry.id)"></div></td>
            </tr>
            <tr v-for="entry in characters" :key="entry.id">
                <td v-for="lang in languages" :key="lang">{{ entry[lang] }}</td><td><div class="close" @click="deleteCharacter(entry.id)"></div></td>
            </tr>
        </table>
    </VBox>
</template>

<script lang="ts">
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import { characterNameStore, familyNameStore, Name, LANGUAGES } from "@/db-index";

export default {
    components: { HBox, VBox },
    data() {
        return {
            languages: LANGUAGES,
            families: [] as Name[],
            characters: [] as Name[],
            lang: "S" as const,
            search: ""
        };
    },
    methods: {
        updateFamilies() {
            familyNameStore.namesLike(this.lang, this.search).then(f => this.families = f);
        },
        deleteFamily(id: string) {
            familyNameStore.delete(id);
            this.updateFamilies();
        },
        updateCharacters() {
            characterNameStore.namesLike(this.lang, this.search).then(f => this.characters = f);
        },
        deleteCharacter(id: string) {
            characterNameStore.delete(id);
            this.updateCharacters();
        },
    },
    watch: {
        search(_) {
            this.updateFamilies();
            this.updateCharacters();
        }
    },
    mounted() {
        this.updateFamilies();
        this.updateCharacters();
    }
};
</script>