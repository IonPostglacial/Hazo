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
        dropUp.value = shouldDropUp();
    } else {
        dropUp.value = false;
    }
});

const OVERFLOW_MARGIN = 16;

function adjustHeight(dropUp: boolean) {
    if (!menu.value) { return; }
    const parent = menu.value.parentElement!;
    const scroll = parent.closest(".scroll");
    if (!scroll) { return; }
    const menuBounds = menu.value.getBoundingClientRect();
    const scrollBounds = scroll.getBoundingClientRect();
    if (dropUp) {
        const parentBounds = parent.getBoundingClientRect();
        const menuTop = menuBounds.top - menuBounds.height - parentBounds.height;
        const menuBottom = menuBounds.top - parentBounds.height;
        if (menuTop < scrollBounds.top) {
            menu.value.style.maxHeight = `${menuBottom - scrollBounds.top - OVERFLOW_MARGIN}px`;
        }
    } else {
        if (menuBounds.bottom > scrollBounds.bottom) {
            menu.value.style.maxHeight = `${scrollBounds.bottom - menuBounds.top - OVERFLOW_MARGIN}px`;
        }
    }
}

watch(dropUp, val => {
    adjustHeight(val);
});

onMounted(() => {
    dropUp.value = shouldDropUp();
    adjustHeight(dropUp.value);
    setTimeout(() => {
        document.addEventListener('click', clickout);
    });
});

onBeforeUnmount(() => {
    document.removeEventListener('click', clickout);
});

function clickout(e: MouseEvent) {
    if (!menu.value) { return; }
    const bounds = menu.value.getBoundingClientRect();
    const clickOut = e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom;
    if (clickOut) {
        emit("clickout");
    }
}

function shouldDropUp() {
    if (!menu.value) { return false; }
    const oldDisplay = menu.value.style.display;
    menu.value.style.display = "block";
    const bounding = menu.value.getBoundingClientRect();
    const dropUp = bounding.top > 0.5 * window.innerHeight;
    menu.value.style.display = oldDisplay;
    return dropUp;
}
</script>