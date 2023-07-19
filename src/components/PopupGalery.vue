<template>
    <dialog v-if="open" class="over-everything white" open>
        <HBox>
            <div class="nowrap no-vertical-overflow flex-grow-1">{{ titleText }}</div>
            <div class="close" @click="close"></div>
        </HBox>
        <PictureGalery :images="images" @image-selected="handleImageSelected"></PictureGalery>
    </dialog>
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