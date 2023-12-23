<template>
    <VBox class="white-background center-items">
        <h2>{{character.name.FR}} {{character.name.EN}} {{character.name.CN}}</h2>
        <p v-for="picture in character.pictures" :key="picture.id">
            <img class="medium-max-width medium-max-height fit-contain" :src="picture.url"/>
        </p>
        <center>
            <characters-tree v-if="character" class="limited-width" :selected-character="character">
            </characters-tree>
        </center>
        <HBox class="flex-wrap">
            <VBox v-for="state in characterStates(character)"
                    :key="state.id"
                    class="width-m thin-border medium-margin">
                <HBox class="flex-grow-1 center-items">
                    <img v-for="picture in state.pictures" :key="picture.id" class="medium-max-width medium-max-height fit-contain" :src="picture.url"/>
                </HBox>
                <Spacer></Spacer>
                <center>
                    <div>{{ state.name.S }}</div>
                    <div>{{ state.name.EN }}</div>
                    <div>{{ state.name.CN }}</div>
                </center>
            </VBox>
        </HBox>
    </VBox>
</template>

<script lang="ts">
import { Character, Dataset, characterStates } from "@/datatypes";
import { PropType } from "vue";
import CharactersTree from "./CharactersTree.vue";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import Spacer from "./toolkit/Spacer.vue";


export default {
    components: { CharactersTree, HBox, Spacer, VBox },
    props: {
        dataset: {type: Object as PropType<Dataset>, required: true },
        character: { type: Object as PropType<Character>, required: true },
    },
    methods: { characterStates }
};
</script>

<style>

</style>