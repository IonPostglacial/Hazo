<template>
    <div class="medium-margin thin-border white-background flex-grow-1 centered-text">
        <div class="horizontal-flexbox cented-aligned dark-background">
            <button v-if="selectedImageIndex > 0" class="no-print background-color-1 font-size-28" @click="previousImage">🡄</button>
            <img class="fit-contain full-width height-full" :src="selectedImage.url" :alt="selectedImage.label">
            <button v-if="selectedImageIndex < images.length - 1" class="no-print background-color-1 font-size-28" @click="nextImage">🡆</button>
        </div>
    </div>
</template>
<script lang="ts">
import { Picture } from "@/datatypes"; // eslint-disable-line no-unused-vars
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars


export default {
    name: "PictureGalery",
    props: {
        images: Array as PropType<Picture[]>,
    },
    data() {
        return {
            selectedImageIndex: 0,
        };
    },
    computed: {
        selectedImage(): Picture {
            if (this.images.length > 0) {
                return this.images[this.selectedImageIndex];
            } else {
                return { id: "", hubUrl: "", url: "", label: "" };
            }
        }
    },
    methods: {
        previousImage() {
            if (this.selectedImageIndex > 0) {
                this.selectedImageIndex--;
                this.$emit("picture-selected", {index: this.selectedImageIndex, picture: this.selectedImage });
            }
        },
        nextImage() {
            if (this.selectedImageIndex < this.images.length - 1) {
                this.selectedImageIndex++;
                this.$emit("picture-selected", { index: this.selectedImageIndex, picture: this.selectedImage });
            }
        },
    }
}
</script>