<template>
    <div class="vertical-flexbox white-background thin-border medium-padding min-width-m centered scroll">
        <div class="vertical-flexbox stick-to-top white-background full-width">
            <div class="horizontal-flexbox centered">
                <select v-model="lang">
                    <option value="S">NS</option>
                    <option value="V">NV</option>
                    <option value="CN">中文名</option>
                </select>
                <input type="search" v-model="search" />
            </div>
        </div>
        <table>
            <tr>
                <th v-for="lang in languages" :key="lang">{{ lang }}</th><th></th>
            </tr>
            <tr v-for="entry in families" :key="entry.id">
                <td v-for="lang in languages" :key="lang">{{ entry[lang] }}</td><td><div class="close" @click="deleteEntry(entry.id)"></div></td>
            </tr>
        </table>
    </div>
</template>

<script lang="ts">
import { familiesWithNamesLike, Name, Language, LANGUAGES_V1, deleteFamily } from "@/db-index";

export default {
    data() {
        return {
            languages: LANGUAGES_V1,
            families: [] as Name[],
            lang: "S" as Language,
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
        search(val) {
            this.updateFamilies();
        }
    },
    mounted() {
        this.updateFamilies();
    }
};
</script>