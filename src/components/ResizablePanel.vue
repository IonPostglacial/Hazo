<template>
    <div :style="'width:'+width+'px'" @mousedown="startResize" @mouseup="endResize" @mouseleave="endResize" @mousemove="resize" class="hover-right-border-10">
        <slot></slot>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import debounce from "@/tools/debounce"

export default Vue.extend({
    props: {
        defaultWidth: Number
    },
    data() {
        return {
            width: this.defaultWidth,
            resizing: false,
        };
    },
    methods: {
        startResize(e: MouseEvent & { target: Element }) {
            const clickX = e.pageX;
            const panelRightX = e.target.getBoundingClientRect().right;
            if (clickX >= panelRightX - 10) {
                this.resizing = true;
            }
        },
        endResize() {
            this.resizing = false;
        },
        resize: debounce(5, function (this: any, e: Array<MouseEvent & { target: Element }>) {
            if (!this.resizing) return;

            const clickX = e[0].pageX;
            const panelRightX = e[0].target.getBoundingClientRect().right;

            if (clickX >= panelRightX - 10) {
                this.width = clickX;
            }

            e[0].stopPropagation();
        })
    }
});
</script>

<style scoped>
    .hover-right-border-10 {
        transition: border-right 50ms;
    }
    .hover-right-border-10:hover {
        border-right: 10px solid #0000007a;
    }
</style>