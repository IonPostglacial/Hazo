<template>
    <div class="medium-margin thin-border white-background flex-grow-1 centered-text">
        <HBox class="cented-aligned dark-background">
            <button v-if="selectedImageIndex > 0" class="no-print background-color-1 font-size-28" @click="previousImage">
                <font-awesome-icon icon="fa-solid fa-arrow-left" />
            </button>
            <img class="fit-contain full-width height-full max-height-screen" :src="selectedImageUrl" :alt="selectedImage.label">
            <button v-if="selectedImageIndex < images.length - 1" class="no-print background-color-1 font-size-28" @click="nextImage">
                <font-awesome-icon icon="fa-solid fa-arrow-right" />
            </button>
        </HBox>
    </div>
</template>
<script lang="ts">
import { Picture } from "@/datatypes"; // eslint-disable-line no-unused-vars
import { PropType } from "vue"; // eslint-disable-line no-unused-vars
import HBox from "./toolkit/HBox.vue";


export default {
    name: "PictureGalery",
    components: { HBox },
    props: {
        images: { type: Array as PropType<Picture[]>, required: true },
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
        },
        selectedImageUrl(): string|undefined {
            return this.selectedImage.hubUrl ?? this.selectedImage.url; 
        },
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