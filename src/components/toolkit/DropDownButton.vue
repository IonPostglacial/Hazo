<template>
    <div class="relative inline-block">
        <button @click="open = !open">
            {{label}}
            <font-awesome-icon v-if="!open" icon="fa-solid fa-caret-down" />
            <font-awesome-icon v-if="open" icon="fa-solid fa-caret-up" />
        </button>
        <drop-down @clickout="handleClickOut" v-if="open" :open="open">
            <slot></slot>
        </drop-down>
    </div>
</template>

<script setup lang="ts">
import DropDown from "@/components/toolkit/DropDown.vue";
import { ref } from "vue";

const { label } = defineProps({ label: String });
const open = ref(false);

function handleClickOut(_: Event) {
    open.value = false;
}
</script>