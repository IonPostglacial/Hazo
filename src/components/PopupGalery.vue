<template>
    <div v-if="open" class="absolute over-everything full-width">
        <header class="horizontal-flexbox medium-padding thin-border background-gradient-1">
            <div class="nowrap no-vertical-overflow flex-grow-1">{{ titleText }}</div>
            <div class="close" @click="close"></div>
        </header>
        <PictureGalery :images="images" @image-selected="handleImageSelected"></PictureGalery>
    </div>
</template>
<script lang="ts">
import { Picture } from "@/datatypes"; // eslint-disable-line no-unused-vars
import PictureGalery from "@/components/PictureGalery.vue";
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars


export default {
    name: "PopupGalery",
    components: { PictureGalery },
    props: {
        images: { type: Array as PropType<Picture[]>, required: true },
        open: Boolean,
    },
    data() {
        return {
            titleText: this.images.length > 0 ? this.images[0].label : "",
        };
    },
    methods: {
        close() {
            this.$emit("closed");
        },
        handleImageSelected({ picture } : { picture: Picture, index: number }) {
            this.titleText = picture.label;
        }
    }
}
</script>