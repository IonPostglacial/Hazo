<template>
    <div @mouseup="persistSplit" ref="root" :class="['split', { 'vertical': vertical }]">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref } from "vue";
import Split, { Instance } from "split.js";


const props = defineProps({ vertical: Boolean, panelId: { required: true, type: String } });
const split = ref<Instance|undefined>(undefined);
const root = ref<HTMLElement>();

function persistSplit() {
    localStorage.setItem(`panel-split-${props.panelId}`, JSON.stringify(split.value?.getSizes()));
}

function updateSplit() {
    if (!root.value) { return; }
    const children = Array.from(root.value.children) as HTMLElement[];
    split.value = Split(children);
    const persisted = localStorage.getItem(`panel-split-${props.panelId}`);
    const persistedSizes = persisted ? JSON.parse(persisted) : [];
    const defaultSizes = children.map((_, i) => i === 0 ? 33 : 67 / (children.length - 1));
    let newSizes;
    if (persistedSizes.length === defaultSizes.length) {
        newSizes = persistedSizes;
    } else {
        newSizes = defaultSizes;
    }
    split.value.setSizes(newSizes);
    persistSplit();
}

onMounted(() => {
    updateSplit();
});
onBeforeUpdate(() => { split.value?.destroy(); });
onUpdated(() => {
    updateSplit();
});
onBeforeUnmount(() => { split.value?.destroy(); });
</script>

<style>
.split {
    display: flex;
    flex-direction: row;
}

.split.vertical {
    flex-direction: column;
}

.gutter {
    background-color: #eee;
    background-repeat: no-repeat;
    background-position: 50%;
}

.gutter.gutter-horizontal {
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
    cursor: col-resize;
}
</style>