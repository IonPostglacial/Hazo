<template>
    <div class="relative inline-block">
        <button @click="open = !open">
            <slot name="label">
                {{label}}
            </slot>
            <font-awesome-icon v-if="(!defaultUp && !open) || (defaultUp && open)" icon="fa-solid fa-caret-down" />
            <font-awesome-icon v-if="(defaultUp && !open) || (!defaultUp && open)" icon="fa-solid fa-caret-up" />
        </button>
        <drop-down @clickout="handleClickOut" v-if="open" :open="open">
            <slot></slot>
        </drop-down>
    </div>
</template>

<script setup lang="ts">
import DropDown from "@/components/toolkit/DropDown.vue";
import { ref } from "vue";

const { label, defaultUp } = defineProps({ label: String, defaultUp: Boolean });
const open = ref(false);

function handleClickOut(_: Event) {
    open.value = false;
}
</script>