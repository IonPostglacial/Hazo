<template>
    <div class="white-background vertical-flexbox center-items">
        <h2>{{character.name.FR}} {{character.name.EN}} {{character.name.CN}}</h2>
        <p v-for="picture in character.pictures" :key="picture.id">
            <img class="medium-max-width medium-max-height fit-contain" :src="picture.url"/>
        </p>
        <center>
            <characters-tree v-if="character" class="limited-width" :selected-character="character">
            </characters-tree>
        </center>
        <div class="horizontal-flexbox flex-wrap">
            <div v-for="state in dataset.characterStates(character)"
                    :key="state.id"
                    class="width-m thin-border medium-margin vertical-flexbox space-between">
                <div class="horizontal-flexbox flex-grow-1 center-items">
                    <img v-for="picture in state.pictures" :key="picture.id" class="medium-max-width medium-max-height fit-contain" :src="picture.url"/>
                </div>
                <center>
                    <div>{{ state.name.S }}</div>
                    <div>{{ state.name.EN }}</div>
                    <div>{{ state.name.CN }}</div>
                </center>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { Character, Dataset } from "@/datatypes";
import Vue, { PropType } from "vue";
import CharactersTree from "./CharactersTree.vue";

export default Vue.extend({
    components: { CharactersTree },
    props: {
        dataset: Object as PropType<Dataset>,
        character: Object as PropType<Character>,
    },
});
</script>

<style>

</style>