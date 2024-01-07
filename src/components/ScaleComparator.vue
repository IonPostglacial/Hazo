<template>
    <VBox>
        <div class="">&nbsp;</div>
        <HBox class="relative align-items-end" :style="'height: ' + height">
            <div class="scale-ruler relative" :style="'height: calc(' + maxPos  + '%)'">
                <HBox class="scale-indicator absolute center-items full-width" :style="'bottom: calc(' + maxPos  + '% - 1ch)'">
                    <div class="flex-grow-1">{{ measurement.max }}</div>
                    <font-awesome-icon icon="fa-solid fa-arrow-right" />
                </HBox>
                <HBox class="scale-indicator absolute center-items full-width" :style="'bottom: calc(' + minPos  + '% - 1ch)'">
                    <div class="flex-grow-1">{{ measurement.min }}</div>
                    <font-awesome-icon icon="fa-solid fa-arrow-right" />
                </HBox>
            </div>
            <img v-if="measurement.character.unit?.name.S === 'm'" class="scale-image" :style="'height: calc(' + imageHeight  + '%)'" src="/images/human.svg" alt="scaled image of a human">
            <img v-if="measurement.character.unit?.name.S === 'cm'" class="scale-image" :style="'height: calc(' + imageHeight  + '%)'" src="/images/hand.svg" alt="scaled image of a human hand">
        </HBox>
    </VBox>
</template>

<script setup lang="ts">
import { Measurement } from '@/datatypes';
import { PropType, computed } from "vue";
import HBox from './toolkit/HBox.vue';
import VBox from './toolkit/VBox.vue';

const props = defineProps({ height: { required: true, type: String }, measurement: { required: true, type: Object as PropType<Measurement> } });

const humanHeight = 1.7;
const handHeight = 18;

const comparatorHeight = computed(() => {
    if (props.measurement.character.unit?.name.S === "m") {
        return humanHeight;
    } else if (props.measurement.character.unit?.name.S === "cm") {
        return handHeight;
    } else {
        return 10;
    }
});
const referenceHeight = computed(() => Math.max(props.measurement.max, comparatorHeight.value));
const minPos = computed(() => 100 * props.measurement.min / referenceHeight.value);
const maxPos = computed(() => 100 * props.measurement.max / referenceHeight.value);
const imageHeight = computed(() => 100 * comparatorHeight.value / referenceHeight.value);
</script>

<style scoped>

    .scale-ruler {
        width: 6ch;
        border-right: 1px solid black;
    }

    .scale-indicator {
        height: 2ch;
    }
</style>