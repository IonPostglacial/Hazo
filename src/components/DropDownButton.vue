<template>
    <div class="relative inline-block">
        <button @click="toggleOpen">
            {{label}}
            <font-awesome-icon v-if="!open" icon="fa-solid fa-caret-down" />
            <font-awesome-icon v-if="open" icon="fa-solid fa-caret-up" />
        </button>
        <drop-down @clickout="handleClickOut" v-if="open" :open="open">
            <slot></slot>
        </drop-down>
    </div>
</template>

<script lang="ts">
import Vue from "vue";
import DropDown from "@/components/DropDown.vue";

export default Vue.extend({
    components: { DropDown },
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
            console.log("toggle");
            this.open = !this.open;
        },
    },
});
</script>

<style>

</style>