<template>
    <div class="thin-border medium-margin white-background vertical-flexbox flex-grow-1">
        <div class="horizontal-flexbox">
        <b class="flex-grow-1 medium-margin">{{ label }}</b>
        <label v-on:click="toggleOpen" class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered">
            <div v-if="open" class="bottom-arrow">&nbsp;</div>
            <div v-if="!open" class="left-arrow">&nbsp;</div>
        </label>
        </div>
        <div v-if="open">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    name: "CollapsiblePanel",
    props: {
        label: String,
    },
    data() {
        return {
            open: true,
        };
    },
    methods: {
        toggleOpen() {
            this.open = !this.open;
        }
    }
})
</script>