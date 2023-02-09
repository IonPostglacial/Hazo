<template>
    <div class="relative inline-block">
        <button @click="toggleOpen">
            {{label}}
            <font-awesome-icon v-if="!open" icon="fa-solid fa-caret-down" />
            <font-awesome-icon v-if="open" icon="fa-solid fa-caret-up" />
        </button>
        <div v-show="open" ref="menu" :class="['absolute', 'thin-border', 'white-background', 'medium-padding', 
                'over-everything', { 'drop-up': dropUp }]">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: {
        label: String,
    },
    data() {
        return {
            open: false,
            dropUp: false,
        }
    },
    methods: {
        handleClickOut(e: Event) {
            this.open = false;
        },
        toggleOpen() {
            this.open = !this.open;
            if (this.open) {
                this.dropUp = this.outOfWindow();
            } else {
                this.dropUp = false;
            }
        },
        close(e: Event) {
            if (!this.$el.contains(e.target as any)) {
                this.open = false
            }
        },
        outOfWindow() {
            const menu = this.$refs.menu as HTMLElement;
            menu.style.display = "block";
            const bounding = menu.getBoundingClientRect();
             menu.style.display = "none";
            return bounding.bottom > window.innerHeight;
        },
    },
    mounted () {
        document.addEventListener('click', this.close);
    },
    beforeDestroy () {
        document.removeEventListener('click', this.close);
    }
});
</script>

<style>

</style>