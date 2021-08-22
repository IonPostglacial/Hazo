<template>
    <div :class="['split', { 'vertical': vertical }]">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import Split, { Instance } from 'split.js'

export default Vue.extend({
    props: {
        vertical: Boolean,
    },
    data() {
        return {
            split: undefined as Instance|undefined,
        };
    },
    mounted() {
        const children = Array.from(this.$el.children) as HTMLElement[];
        this.split = Split(children);
        this.split.setSizes(children.map((_, i) => i === 0 ? 33 : 67 / (children.length - 1)));
    },
    beforeUpdate() {
        this.split?.destroy();
    },
    updated() {
        const children = Array.from(this.$el.children) as HTMLElement[];
        this.split = Split(children);
        this.split.setSizes(children.map((_, i) => i === 0 ? 33 : 67 / (children.length - 1)));
    },
    beforeDestroy() {
        this.split?.destroy();
    }
});
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