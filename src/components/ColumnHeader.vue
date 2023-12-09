<template>
    <HBox class="center-items background-gradient-1">
        <b class="medium-padding">{{ label }}</b>
        <Spacer></Spacer>
        <div class="button-group">
            <button @click="emit('maximize')">
                <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
            </button>
            <button @click="emit('minimize')">
                <font-awesome-icon icon="fa-solid fa-close" />
            </button>
        </div>
    </HBox>
</template>

<script setup lang="ts">
import HBox from "./toolkit/HBox.vue";
import Spacer from "./toolkit/Spacer.vue";

const emit = defineEmits(["maximize", "minimize"]);

const { label } = defineProps({ label: String });
</script>