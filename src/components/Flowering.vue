<template>
    <div class="relative">
        <button class="absolute-top-right" @click="downloadSVG">
            <font-awesome-icon icon="fa-solid fa-download" />
        </button>
        <svg ref="svg" version="1.1" width="300" height="300" xmlns="http://www.w3.org/2000/svg" @click="wheelClicked">
            <clipPath id="outer-circle">
                <circle cx="150" cy="150" r="145" />
            </clipPath>
            <clipPath id="winter">
                <rect x="50%" y="0" width="50%" height="50%" />
            </clipPath>
            <clipPath id="spring">
                <rect x="50%" y="50%" width="50%" height="50%" />
            </clipPath>
            <clipPath id="summer">
                <rect x="0" y="50%" width="50%" height="50%" />
            </clipPath>
            <clipPath id="autumn">
                <rect x="0" y="0" width="50%" height="50%" />
            </clipPath>
            <circle cx="150" cy="150" r="145" fill="white" stroke="black" stroke-width="2" />
            <polygon v-for="month, i in months"
                :data-month="i"
                points="150 0, 236.60254037844385 0, 150 150" 
                :transform="'rotate(' + (30 + 30 * i) + ')'" 
                transform-origin="center" 
                stroke="black" 
                :fill="hasMonth(i) ? '#84bf3d' : 'white'"
                :title="month"
                clip-path="url(#outer-circle)">
            </polygon>
            <circle cx="150" cy="150" r="100" fill="#afe5ff" stroke="black" stroke-width="2" clip-path="url(#winter)" />
            <circle cx="150" cy="150" r="100" fill="#84bf3d" stroke="black" stroke-width="2" clip-path="url(#spring)" />
            <circle cx="150" cy="150" r="100" fill="#ffdf34" stroke="black" stroke-width="2" clip-path="url(#summer)" />
            <circle cx="150" cy="150" r="100" fill="#eaa256" stroke="black" stroke-width="2" clip-path="url(#autumn)" />
            <text v-for="month, i in months" class="month-text" x="50%" y="50%" 
                :transform="'rotate(' + (45 + 30 * i) + ') translate(0 -135)'" 
                :data-month="i"
                transform-origin="center" font-size="14" 
                text-anchor="middle" dominant-baseline="central" 
                fill="black">
                {{ month }}
            </text>
        </svg>
    </div>
</template>

<script lang="ts">
import Months from "@/datatypes/Months";
import download from "@/tools/download";
import { PropType } from "vue";


export default {
    props: {
        modelValue: { type: Object as PropType<number[]>, required: true },
    },
    data() {
        return {
            months: Months.NAMES,
        };
    },
    methods: {
        downloadSVG() {
            const svg = this.$refs.svg as SVGElement;
            download(svg.outerHTML, "svg", "flowering");
        },
        wheelClicked(e: MouseEvent) {
            if (e.target == null || !(e.target instanceof SVGElement)) { return; }
            const month = e.target?.dataset?.month;
            if (month) {
                const monthIndex = parseInt(month);
                if (!Number.isNaN(monthIndex) && monthIndex >= 0 && monthIndex < 12) {
                    this.toggleMonth(monthIndex);
                }
            }
        },
        toggleMonth(month: number) {
            let newVal: number[] = [];
            if (this.modelValue.includes(month)) {
                this.$emit("month-unselected", month);
                newVal = this.modelValue.filter(m => m !== month);
            } else {
                this.$emit("month-selected", month);
                newVal = [...this.modelValue, month];
            }
            this.$emit("update:modelValue", newVal);
        },
        hasMonth(month: number): boolean {
            return this.modelValue.includes(month);
        },
    },
};
</script>

<style>
    .month-text {
        user-select: none;
    }
</style>