<template>
    <div :style="Number.isNaN(width) ? '' : ('min-width:' + width + 'px')" class="panel horizontal-flexbox space-between">
        <div class="flex-grow-1">
            <slot></slot>
        </div>
        <div class="right-border-10 no-shrink" @mousedown="startResize"></div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import debounce from "@/tools/debounce"
// @mousedown="startResize" @mouseup="endResize" @mouseleave="endResize" @mousemove="resize"
export default defineComponent({
    props: {
        defaultWidth: Number
    },
    data() {
        return {
            width: this.defaultWidth,
            resizing: false,
            dragStartingX: 0,
            ondrag: debounce(5, function (this: any, e: MouseEvent) {
                if (this.resizing) {
                    this.width = e.pageX;
                }
            }).bind(this)
        };
    },
    created() {
        window.addEventListener("mousemove", this.ondrag);
        window.addEventListener("mouseleave", this.endResize.bind(this));
        window.addEventListener("mouseup", this.endResize.bind(this));
    },
    destroyed() {
        window.removeEventListener("mousemove", this.ondrag);
    },
    methods: {
        startResize(e: MouseEvent & { target: Element }) {
            const clickX = e.pageX;

            this.resizing = true;
            this.dragStartingX = clickX;
        },
        endResize() {
            this.resizing = false;
            this.dragStartingX = 0;
        }
    }
});
</script>

<style scoped>
    .panel:hover .right-border-10 {
        border-right: 10px solid #0000007a;
    }
</style>