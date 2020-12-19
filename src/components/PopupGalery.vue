<template>
    <div v-if="open" class="absolute over-everything full-width medium-margin thin-border white-background flex-grow-1 centered-text">
        <header class="horizontal-flexbox medium-padding thin-border background-gradient-1">
            <div class="nowrap no-vertical-overflow flex-grow-1">{{ selectedImage.label }}</div><div class="close" @click="close"></div>
        </header>
        <div class="horizontal-flexbox cented-aligned dark-background">
            <button v-if="selectedImageIndex > 0" class="background-color-1 font-size-28" @click="selectedImageIndex--">🡄</button>
            <img class="max-width-screen max-height-screen" :src="selectedImage.url" :alt="selectedImage.label">
            <button v-if="selectedImageIndex < images.length - 1" class="background-color-1 font-size-28" @click="selectedImageIndex++">🡆</button>
        </div>
    </div>
</template>
<script lang="ts">
import { Picture } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars


export default Vue.extend({
    name: "PopupGalery",
    props: {
        images: Array as PropType<Picture[]>,
        open: Boolean,
    },
    data() {
        return {
            selectedImageIndex: 0,
        };
    },
    computed: {
        selectedImage(): Picture {
            return this.images[this.selectedImageIndex];
        }
    },
    methods: {
        close() {
            this.$emit("closed");
        }
    }
})
</script>