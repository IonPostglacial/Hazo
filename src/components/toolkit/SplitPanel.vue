<template>
    <div ref="root" :class="['split', { 'vertical': vertical }]">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref } from "vue";
import Split, { Instance } from "split.js";


const { vertical } = defineProps({ vertical: Boolean });
const split = ref<Instance|undefined>(undefined);
const root = ref<HTMLElement>();

function updateSplit() {
    if (!root.value) { return; }
    const children = Array.from(root.value.children) as HTMLElement[];
    split.value = Split(children);
    split.value.setSizes(children.map((_, i) => i === 0 ? 33 : 67 / (children.length - 1)));
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