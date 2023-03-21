<template>
    <VBox class="relative">
        <div v-if="editable" @click="deletePhoto" class="close white absolute-top-right"></div>
        <a @click="openPhoto" class="small-margin thin-border fill dark-background" href="#1">
            <img :src="url" :alt="picture.label">
        </a>
        <button class="background-color-1" v-if="isRemoteUrl && isConnectedToHub" @click="uploadPhoto">Retrieve Photo</button>
        <HBox v-if="editable">
            <input :value="picture.url" @change="setPhoto" type="text" class="no-fixed-width flex-grow-1" />
        </HBox>
    </VBox>
</template>

<script lang="ts">
import { PropType } from "vue";
import { Picture, uploadPicture } from "@/datatypes";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import Spacer from "./toolkit/Spacer.vue";


export default {
    components: { HBox, Spacer, VBox },
    props: {
        index: Number,
        editable: Boolean,
        picture: { type: Object as PropType<Picture>, required: true },
    },
    computed: {
        url(): string|undefined {
            return this.isRemoteUrl ? this.picture?.url : this.picture?.hubUrl; 
        },
        isRemoteUrl(): boolean {
            return typeof this.picture?.hubUrl === "undefined";
        },
        isConnectedToHub(): boolean {
            return Hazo.store.connectedToHub;
        },
    },
    mounted() {
        if (Hazo.store.connectedToHub && typeof this.picture !== "undefined" && typeof this.picture.hubUrl === "undefined") {
            this.uploadPhoto();
        }
    },
    methods: {
        deletePhoto() {
            this.$emit("delete-photo", { detail: { index: this.index } });
        },
        openPhoto() {
            this.$emit("open-photo", { detail: { index: this.index } });
        },
        setPhoto(e: Event) {
            if (e.target instanceof HTMLInputElement && e.target.value) {
                const val = e.target.value;
                uploadPicture(val).then(url => {
                    this.$emit("set-photo", { detail: { src: val, hubUrl: url, index: this.index } })
                });
            }
        },
        uploadPhoto() {
            const oldUrl = this.picture?.url;
            if (oldUrl) {
                uploadPicture(oldUrl).then(url => {
                    this.$emit("set-photo", { detail: { src: oldUrl, hubUrl: url, index: this.index } })
                });
            }
        },
    }
}
</script>