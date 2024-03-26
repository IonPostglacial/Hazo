<template>
  <VBox class="thin-border medium-margin white-background">
        <HBox @click="open = !open" class="clickable center-items">
            <b class="flex-grow-1 medium-padding">{{ label }}</b>
            <VBox class="small-square blue-circle-hover thin-margin flex-centered">
                <font-awesome-icon v-if="open" icon="fa-solid fa-chevron-down" />
                <font-awesome-icon v-if="!open" icon="fa-solid fa-chevron-up" />
            </VBox>
        </HBox>
        <div :class="open ? '' : 'invisible'">
            <slot></slot>
        </div>
    </VBox>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import HBox from "./HBox.vue";
import VBox from "./VBox.vue";

function collapsiblePanelId(id: string) {
    return `collapsible-panel-open-${id}`;
}

function getSavedOpenState(id: string): boolean {
    const text = window.localStorage.getItem(collapsiblePanelId(id));
    if (text === null) {
        return true;
    }
    try {
        const value = JSON.parse(text);
        if (typeof value === "boolean") {
            return value;
        } else {
            return true;
        }
    } catch {
        return true;
    }
}

const { label, panelId } = defineProps({ label: String, panelId: String });
const open = ref(panelId ? getSavedOpenState(panelId) : true);

watch(open, (value: boolean) => {
    if (panelId) {
        window.localStorage.setItem(collapsiblePanelId(panelId), JSON.stringify(value));
    }
});
</script>