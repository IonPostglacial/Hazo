<template>
    <div ref="menu" v-show="open" :class="['absolute', 'thin-border', 'white-background', 'medium-padding', 
            'over-everything', 'max-height-screen', 'scroll', { 'drop-up': dropUp }]">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';


const { open } = defineProps({ open: Boolean });
const emit = defineEmits(["clickout"]);
const menu = ref<HTMLElement | null>(null);
const dropUp = ref(false);

watch(() => open, val => {
    if (val) {
        dropUp.value = outOfWindow();
    } else {
        dropUp.value = false;
    }
});

onMounted(() => {
    dropUp.value = outOfWindow();
    setTimeout(() => {
        document.addEventListener('click', clickout);
    });
});

onBeforeUnmount(() => {
    document.removeEventListener('click', clickout);
});

function clickout(e: Event) {
    if (!menu.value?.contains(e.target as any)) {
        emit("clickout");
    }
}

function outOfWindow() {
    if (!menu.value) { return false; }
    const oldDisplay = menu.value.style.display;
    menu.value.style.display = "block";
    const bounding = menu.value.getBoundingClientRect();
    menu.value.style.display = oldDisplay;
    return bounding.bottom > window.innerHeight;
}
</script>