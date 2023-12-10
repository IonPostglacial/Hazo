<template>
    <HBox class="center-items glass-background thin-border">
        <b class="medium-padding">{{ label }}</b>
        <Spacer></Spacer>
        <div class="button-group">
            <button v-if="!hideActions" @click="emit('maximize')">
                <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
            </button>
            <button v-if="!hideActions" @click="emit('minimize')">
                <font-awesome-icon icon="fa-solid fa-close" />
            </button>
        </div>
    </HBox>
</template>

<script setup lang="ts">
import HBox from "./toolkit/HBox.vue";
import Spacer from "./toolkit/Spacer.vue";

const emit = defineEmits(["maximize", "minimize"]);

const { label, hideActions } = defineProps({ label: String, hideActions: Boolean });
</script>