<template>
    <div class="relative">
        <button class="absolute-top-right" @click="downloadSVG">
            <font-awesome-icon icon="fa-solid fa-download" />
        </button>
    <svg ref="svg" version="1.1" viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" @click="wheelClicked">
            <clipPath v-for="_, i in modelValue" :id="'circle-' + i">
                <circle cx="150" cy="150" :r="145 - i * trackWidth" />
            </clipPath>
            <clipPath id="dry">
                <rect x="0" y="0" width="50%" height="100%" transform="rotate(-30)" transform-origin="center"  />
            </clipPath>
            <clipPath id="wet">
                <rect x="50%" y="0" width="50%" height="100%" transform="rotate(-30)" transform-origin="center" />
            </clipPath>
            <circle v-for="_, i in modelValue" :id="'circle-' + i" cx="150" cy="150" :r="145 - i * trackWidth" fill="white" stroke="black" stroke-width="2" />
            <g v-for="track, j in modelValue">
                <polygon v-for="month, i in months"
                    :data-track="j"
                    :data-month="i"
                    points="150 0, 236.60254037844385 0, 150 150" 
                    :transform="'rotate(' + (30 + 30 * i) + ')'" 
                    transform-origin="center"
                    stroke="black" 
                    :fill="hasMonth(j, i) ? track.color : 'white'"
                    :title="month"
                    :clip-path="'url(#circle-' + j + ')'">
                </polygon>
            </g>
            <circle cx="150" cy="150" :r="145 - modelValue.length * trackWidth" fill="#eae178" stroke="black" stroke-width="1" clip-path="url(#dry)" />
            <circle cx="150" cy="150" :r="145 - modelValue.length * trackWidth" fill="#6ec2c1" stroke="black" stroke-width="1" clip-path="url(#wet)" />
            <text v-for="month, i in months" class="month-text" x="50%" y="50%" 
                :transform="'rotate(' + (45 + 30 * i) + ') translate(0 -135)'" 
                :data-track="0"
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
import clone from "@/tools/clone";
import download from "@/tools/download";
import { PropType } from "vue";

export type Track = {
    name: string, 
    color: string,
    data: number[],
};

export default {
    props: {
        modelValue: { type: Array as PropType<Track[]>, required: true },
    },
    data() {
        return {
            months: Months.NAMES,
        };
    },
    computed: {
        trackWidth(): number {
            return this.modelValue.length < 2 ? 40: 20;
        }
    },
    methods: {
        downloadSVG() {
            const svg = this.$refs.svg as SVGElement;
            download(svg.outerHTML, "svg", "flowering");
        },
        validateMonth(n: number): boolean {
            return !Number.isNaN(n) && n >= 0 && n < 12
        },
        wheelClicked(e: MouseEvent) {
            if (e.target == null || !(e.target instanceof SVGElement)) { return; }
            const track = e.target?.dataset?.track;
            const month = e.target?.dataset?.month;
            if (track && month) {
                const trackIndex = parseInt(track);
                const monthIndex = parseInt(month);
                if (trackIndex >= 0 && trackIndex < this.modelValue.length && this.validateMonth(monthIndex)) {
                    this.toggleMonth(trackIndex, monthIndex);
                }
            }
        },
        toggleMonth(track: number, month: number) {
            const clickedTrack = this.modelValue[track];
            if (clickedTrack.data.includes(month)) {
                this.$emit("month-unselected", month);
                clickedTrack.data = clickedTrack.data.filter(m => m !== month);
            } else {
                this.$emit("month-selected", month);
                clickedTrack.data.push(month);
            }
            this.$emit("update:modelValue",  clone(this.modelValue));
        },
        hasMonth(track: number, month: number): boolean {
            return this.modelValue[track].data.includes(month);
        },
    },
};
</script>

<style>
    .month-text {
        user-select: none;
    }
</style>