<template>
    <ul class="horizontal-flexbox button-group">
        <li v-for="choice, index in choices" :key="index" :class="['button', 'no-list-style', { 'background-color-1': modelValue.includes(index) }]" @click="toggleSelected(index)">
            {{ choice }}
        </li>
    </ul>
</template>

<script setup lang="ts">
    import { PropType, defineModel } from "vue";

    defineProps({ choices: { type: Array as PropType<string[]>, required: true } });
    const modelValue = defineModel({ type: Array as PropType<number[]>, required: true });

    function toggleSelected(index: number) {
        if (modelValue.value.includes(index)) {
            modelValue.value = modelValue.value.filter(i => i !== index);
        } else {
            modelValue.value = [...modelValue.value, index].sort();
        }
    }
</script>