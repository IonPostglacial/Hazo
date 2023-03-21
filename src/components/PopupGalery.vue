<template>
    <div v-if="open" class="absolute over-everything full-width">
        <HBox class="medium-padding thin-border background-gradient-1">
            <div class="nowrap no-vertical-overflow flex-grow-1">{{ titleText }}</div>
            <div class="close" @click="close"></div>
        </HBox>
        <PictureGalery :images="images" @image-selected="handleImageSelected"></PictureGalery>
    </div>
</template>
<script lang="ts">
import { Picture } from "@/datatypes"; // eslint-disable-line no-unused-vars
import PictureGalery from "@/components/PictureGalery.vue";
import HBox from "./toolkit/HBox.vue";
import { PropType } from "vue"; // eslint-disable-line no-unused-vars


export default {
    name: "PopupGalery",
    components: { HBox, PictureGalery },
    props: {
        images: { type: Array as PropType<Picture[]>, required: true },
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
}
</script>