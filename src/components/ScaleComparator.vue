<template>
    <VBox class="end-justified" :style="'height: calc(24px + ' + totalHeightFactor.toString() + ' * ' + height.toString() + ')'">
        <div class="">&nbsp;</div>
        <HBox class="relative align-items-end" :style="'height: ' + height">
            <div class="scale-ruler relative" :style="'height: calc(' + maxPos  + '%)'">
                <HBox class="scale-indicator absolute center-items full-width" :style="'bottom: calc(' + Math.min(maxPos, 100)  + '% - 1ch)'">
                    <div class="flex-grow-1">{{ fromNormalizedValue(measurement.max, measurement.character.unit)?.toFixed(2) ?? "?" }}</div>
                    <font-awesome-icon icon="fa-solid fa-arrow-right" />
                </HBox>
                <HBox class="scale-indicator absolute center-items full-width" :style="'bottom: ' + (minPos ? 'calc(' + Math.min(minPos, 100)  + '% - 1ch)' : '0')">
                    <div class="flex-grow-1">{{ fromNormalizedValue(measurement.min, measurement.character.unit)?.toFixed(2) ?? "?" }}</div>
                    <font-awesome-icon icon="fa-solid fa-arrow-right" />
                </HBox>
            </div>
            <img class="scale-image" :style="'height: calc(' + imageHeight  + '%)'" :src="comparator.img" :alt="comparator.alt">
        </HBox>
    </VBox>
</template>

<script setup lang="ts">
import { Measurement } from '@/datatypes';
import { PropType, computed } from "vue";
import HBox from './toolkit/HBox.vue';
import VBox from './toolkit/VBox.vue';
import { fromNormalizedValue } from '@/features/unit';
import { Config } from '@/tools/config';

const props = defineProps({ height: { required: true, type: String }, measurement: { required: true, type: Object as PropType<Measurement> } });

const comparisons = [
    { img: Config.siteUrl + "images/nail.svg", alt: "scaled image of a finger nail", height: 0.014, max: 0.07 },
    { img: Config.siteUrl + "images/hand.svg", alt: "scaled image of a human hand", height: 0.16, max: 0.50 },
    { img: Config.siteUrl + "images/human.svg", alt: "scaled image of a human", height: 1.6, max: 10 },
    { img: Config.siteUrl + "images/elephant.svg", alt: "scaled image of an elephant", height: 2.30, max: 50 },
    { img: Config.siteUrl + "images/eiffel-tower.svg", alt: "scaled image of the Eiffel Tower", height: 330, max: 1000 },
];

const comparator = computed(() => {
    for (const comparator of comparisons) {
        if (props.measurement.max <= comparator.max) {
            return comparator;
        }
    }
    return comparisons[comparisons.length - 1];
});

const imageHeight = computed(() => 75);
const minPos = computed(() => props.measurement.min ? 75 * props.measurement.min / comparator.value.height : undefined);
const maxPos = computed(() => 75 * props.measurement.max / comparator.value.height);
const totalHeightFactor = computed(() => 0.01 * Math.max(imageHeight.value, maxPos.value));
</script>

<style scoped>

    .scale-ruler {
        width: 8ch;
        border-right: 1px solid black;
    }

    .scale-indicator {
        height: 2ch;
    }
</style>