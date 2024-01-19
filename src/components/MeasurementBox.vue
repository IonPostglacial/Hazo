<template>
    <VBox>
        <ScaleComparator 
            v-if="measurement && ['m', 'cm', 'mm'].includes(measurement.character.unit?.name.S ?? '')" 
            height="200px" 
            :measurement="measurement">
        </ScaleComparator>
        <div v-if="measurement">
            {{ measurement.character.name[langProperty] }}: 
            {{ minValue.toFixed(2) }} - {{ maxValue.toFixed(2) }}
            {{ measurement.character.unit?.name.S }}
        </div>
    </VBox>
</template>

<script setup lang="ts">
import { fromNormalizedValue } from '@/features/unit';
import { Measurement } from '@/datatypes';
import { PropType, computed } from "vue";
import VBox from './toolkit/VBox.vue';
import ScaleComparator from './ScaleComparator.vue';

const props = defineProps({
    measurement: { required: true, type: Object as PropType<Measurement> },
    langProperty: { required: true, type: String },
});

const minValue = computed(() => fromNormalizedValue(props.measurement.min, props.measurement.character.unit))
const maxValue = computed(() => fromNormalizedValue(props.measurement.max, props.measurement.character.unit))
</script>