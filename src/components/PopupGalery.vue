<template>
    <dialog class="white medium-padding thin-border" ref="dialog">
        <HBox class="center-items medium-padding">
            <div class="nowrap no-vertical-overflow flex-grow-1">{{ title }}</div>
            <div class="close" @click="close"></div>
        </HBox>
        <PictureGalery :images="images"></PictureGalery>
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
        title: String,
        images: { type: Array as PropType<Picture[]>, required: true },
        open: Boolean,
    },
    watch: {
        open() {
            const dialog = this.$refs.dialog as HTMLDialogElement;
            if (this.open) {
                dialog.showModal();
            } else {
                dialog.close();
            }
        }
    },
    methods: {
        close() {
            this.$emit("closed");
        },
    }
}
</script>