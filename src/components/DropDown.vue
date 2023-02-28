<template>
    <div v-show="open" :class="['absolute', 'thin-border', 'white-background', 'medium-padding', 
            'over-everything', { 'drop-up': dropUp }]">
        <slot></slot>
    </div>
</template>

<script lang="ts">
export default {
    props: {
        open: Boolean,
    },
    data() {
        return {
            dropUp: false,
        }
    },
    watch: {
        open(val) {
            if (val) {
                this.dropUp = this.outOfWindow();
            } else {
                this.dropUp = false;
            }
        }
    },
    methods: {
        clickout(e: Event) {
            if (!this.$el.contains(e.target as any)) {
                this.$emit("clickout");
            }
        },
        outOfWindow() {
            const menu = this.$el as HTMLElement;
            const oldDisplay = menu.style.display;
            menu.style.display = "block";
            const bounding = menu.getBoundingClientRect();
            menu.style.display = oldDisplay;
            return bounding.bottom > window.innerHeight;
        },
    },
    mounted () {
        this.dropUp = this.outOfWindow();
        setTimeout(() => {
            document.addEventListener('click', this.clickout);
        });
    },
    beforeUnmount () {
        document.removeEventListener('click', this.clickout);
    }
};
</script>

<style>

</style>