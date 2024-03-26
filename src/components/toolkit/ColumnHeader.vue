<template>
    <HBox class="center-items glass-background thin-border">
        <b class="medium-padding">{{ label }}</b>
        <Spacer></Spacer>
        <HBox class="button-group">
            <slot></slot>
            <button v-if="!hideActions" @click="emit('maximize')">
                <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
            </button>
            <button v-if="!hideActions" @click="emit('minimize')">
                <font-awesome-icon icon="fa-solid fa-close" />
            </button>
        </HBox>
    </HBox>
</template>

<script setup lang="ts">
import HBox from "./HBox.vue";
import Spacer from "./Spacer.vue";

const emit = defineEmits(["maximize", "minimize"]);

const { label, hideActions } = defineProps({ label: String, hideActions: Boolean });
</script>