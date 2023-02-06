<template>
    <div class="relative inline-block">
        <button @click="toggleOpen">
            {{label}}
            <font-awesome-icon v-if="!open" icon="fa-solid fa-caret-down" />
            <font-awesome-icon v-if="open" icon="fa-solid fa-caret-up" />
        </button>
        <div v-if="open" class="absolute thin-border white-background medium-padding over-everything">
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
        }
    },
    methods: {
        handleClickOut(e: Event) {
            this.open = false;
        },
        toggleOpen() {
            this.open = !this.open;
        },
        close(e: Event) {
            if (!this.$el.contains(e.target as any)) {
                this.open = false
            }
        }
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