<template>
    <VBox>
        <ScaleComparator 
            v-if="measurement && ['m', 'cm', 'mm'].includes(measurement.character.unit?.name.S ?? '')" 
            height="200px" 
            :measurement="measurement">
        </ScaleComparator>
        <VBox v-if="measurement">
            <h3>{{ langProperties.map(prop => measurement.character.name[prop]).join(" / ") }}</h3>
            <HBox>
                {{ minValue?.toFixed(2) }} - {{ maxValue?.toFixed(2) }}
                {{ measurement.character.unit?.name.S }}
            </HBox>
        </VBox>
    </VBox>
</template>

<script setup lang="ts">
import { fromNormalizedValue } from '@/features/unit';
import { Measurement } from '@/datatypes';
import { PropType, computed } from "vue";
import VBox from './toolkit/VBox.vue';
import HBox from './toolkit/HBox.vue';
import ScaleComparator from './ScaleComparator.vue';

const props = defineProps({
    measurement: { required: true, type: Object as PropType<Measurement> },
    langProperties: { required: true, type: Array as PropType<string[]> },
});

const minValue = computed(() => fromNormalizedValue(props.measurement.min, props.measurement.character.unit))
const maxValue = computed(() => fromNormalizedValue(props.measurement.max, props.measurement.character.unit))
</script>