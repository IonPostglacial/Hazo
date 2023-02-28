<template>
    <div class="outer-wheel">
        <div id="wheel" @click="selectMonth" class="wheel">
            <div :class="['month', 'rotation-0-11', { selected: hasMonth(1) }]">J</div>
            <div :class="['month', 'rotation-1-11', { selected: hasMonth(2) }]">F</div>
            <div :class="['month', 'rotation-2-11', { selected: hasMonth(4) }]">M</div>
            <div :class="['month', 'rotation-3-11', { selected: hasMonth(8) }]">A</div>
            <div :class="['month', 'rotation-4-11', { selected: hasMonth(16) }]">M</div>
            <div :class="['month', 'rotation-5-11', { selected: hasMonth(32) }]">J</div>
            <div :class="['month', 'rotation-6-11', { selected: hasMonth(64) }]">J</div>
            <div :class="['month', 'rotation-7-11', { selected: hasMonth(128) }]">A</div>
            <div :class="['month', 'rotation-8-11', { selected: hasMonth(256) }]">S</div>
            <div :class="['month', 'rotation-9-11', { selected: hasMonth(512) }]">O</div>
            <div :class="['month', 'rotation-10-11', { selected: hasMonth(1024) }]">N</div>
            <div :class="['month', 'rotation-11-11', { selected: hasMonth(2048) }]">D</div>
        </div>
        <div id="inner-wheel" class="inner-wheel"></div>
    </div>
</template>

<script lang="ts">
import Months from "@/datatypes/Months";

const ZONE_RATIO = 12 / (2 * Math.PI);

function trigoAngle(cx: number, cy: number, px: number, py: number): number {
    const rx = px - cx;
    const ry = py - cy;
    let theta = Math.atan(ry / rx);
    if (rx < 0) {
        if (ry > 0) {
            theta += Math.PI
        } else {
            theta -= Math.PI;
        }
    }
    theta += Math.PI / 2;
    if (theta < 0) {
        theta += 2 * Math.PI;
    }
    return theta;
}

function elementCenter(e: Element) {
    const elementRect = e.getBoundingClientRect();
    return [
        (elementRect.left + elementRect.right) / 2,
        (elementRect.top + elementRect.bottom) / 2,
    ];
}

function eventDocumentPosition(e: MouseEvent) {
    return [
        e.pageX - window.scrollX,
        e.pageY - window.scrollY,
    ];
}

export default {
    props: {
        modelValue: Number,
    },
    methods: {
        hasMonth(month: number): boolean {
            return Months.has(this.modelValue, month);
        },
        selectMonth(e: MouseEvent) {
            e.stopPropagation();
            const wheel = e.target as Element;
            const [centerX, centerY] = elementCenter(wheel);
            const [clickX, clickY] = eventDocumentPosition(e);
            const angle = trigoAngle(centerX, centerY, clickX, clickY);
            const monthIndex = (angle * ZONE_RATIO | 0);
            const selectedMonth = 1 << monthIndex;
            let newVal = 0;
            if (Months.has(this.modelValue, selectedMonth)) {
                this.$emit("month-unselected", monthIndex);
                newVal = Months.without(this.modelValue, selectedMonth);
            } else {
                this.$emit("month-selected", monthIndex);
                newVal = Months.with(this.modelValue, selectedMonth);
            }
            this.$emit("update:modelValue", newVal);
        },
    },
};
</script>

<style>
	.month {
	    position: absolute;
	    top: 0;
	    bottom: 0;
	    left: 0;
	    right: 0;
	    border-radius: 300px;
	    text-align: center;
	}

	.month.selected {
	    background: conic-gradient(#7abb39 1deg 15deg, transparent 15deg 346deg, #7abb39 346deg 360deg);
	}

    .outer-wheel {
        display: inline-block;
        position: relative;
        width: 300px;
        height: 300px;
        width: 300px;
        height: 300px;
        border-radius: 300px;
        transform: rotate(-0.5deg);
        border: 2px solid #515151;
        background: conic-gradient(
            #515151 calc(0 * 30deg) calc(0 * 30deg + 1deg), transparent calc(0 * 30deg + 1deg) calc((1 + 0) * 30deg),
            #515151 calc(1 * 30deg) calc(1 * 30deg + 1deg), transparent calc(1 * 30deg + 1deg) calc((1 + 1) * 30deg),
            #515151 calc(2 * 30deg) calc(2 * 30deg + 1deg), transparent calc(2 * 30deg + 1deg) calc((1 + 2) * 30deg),
            #515151 calc(3 * 30deg) calc(3 * 30deg + 1deg), transparent calc(3 * 30deg + 1deg) calc((1 + 3) * 30deg),
            #515151 calc(4 * 30deg) calc(4 * 30deg + 1deg), transparent calc(4 * 30deg + 1deg) calc((1 + 4) * 30deg),
            #515151 calc(5 * 30deg) calc(5 * 30deg + 1deg), transparent calc(5 * 30deg + 1deg) calc((1 + 5) * 30deg),
            #515151 calc(6 * 30deg) calc(6 * 30deg + 1deg), transparent calc(6 * 30deg + 1deg) calc((1 + 6) * 30deg),
            #515151 calc(7 * 30deg) calc(7 * 30deg + 1deg), transparent calc(7 * 30deg + 1deg) calc((1 + 7) * 30deg),
            #515151 calc(8 * 30deg) calc(8 * 30deg + 1deg), transparent calc(8 * 30deg + 1deg) calc((1 + 8) * 30deg),
            #515151 calc(9 * 30deg) calc(9 * 30deg + 1deg), transparent calc(9 * 30deg + 1deg) calc((1 + 9) * 30deg),
            #515151 calc(10 * 30deg) calc(10 * 30deg + 1deg), transparent calc(10 * 30deg + 1deg) calc((1 + 10) * 30deg),
            #515151 calc(11 * 30deg) calc(11 * 30deg + 1deg), transparent calc(11 * 30deg + 1deg) calc((1 + 11) * 30deg));
    }

    .wheel {
	    border-radius: 300px;
            display: inline-block;
            width: 100%;
            height: 100%;
    }

	.rotation-0-11 {
	    transform: rotate(calc(0 * 30deg + 15deg));
	}

	.rotation-1-11 {
	    transform: rotate(calc(1 * 30deg + 15deg));
	}

	.rotation-2-11 {
	    transform: rotate(calc(2 * 30deg + 15deg));
	}

	.rotation-3-11 {
	    transform: rotate(calc(3 * 30deg + 15deg));
	}

	.rotation-4-11 {
	    transform: rotate(calc(4 * 30deg + 15deg));
	}

	.rotation-5-11 {
	    transform: rotate(calc(5 * 30deg + 15deg));
	}

	.rotation-6-11 {
	    transform: rotate(calc(6 * 30deg + 15deg));
	}

	.rotation-7-11 {
	    transform: rotate(calc(7 * 30deg + 15deg));
	}

	.rotation-8-11 {
	    transform: rotate(calc(8 * 30deg + 15deg));
	}

	.rotation-9-11 {
	    transform: rotate(calc(9 * 30deg + 15deg));
	}

	.rotation-10-11 {
	    transform: rotate(calc(10 * 30deg + 15deg));
	}

	.rotation-11-11 {
	    transform: rotate(calc(11 * 30deg + 15deg));
	}

	.inner-wheel {
	    display: inline-block;
	    position: absolute;
	    top: 48px;
	    left: 48px;
	    width: 200px;
	    height: 200px;
	    border-radius: 200px;
        transform: rotate(-30deg);
	    background: conic-gradient(#afe5ff 0deg 90deg, #84bf3d 90deg 180deg, #ffdf34 180deg 270deg, #eaa256 270deg 360deg);
	    border: 2px solid #515151;
	}
</style>