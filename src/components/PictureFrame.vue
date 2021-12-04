<template>
    <div class="vertical-flexbox space-between relative">
        <div v-if="editable" @click="deletePhoto" class="close white absolute-top-right"></div>
        <a @click="openPhoto" class="small-margin thin-border fill dark-background" href="#1">
            <img :src="url" :alt="picture.label">
        </a>
        <button class="background-color-1" v-if="isRemoteUrl && isConnectedToHub" @click="uploadPhoto">Retrieve Photo</button>
        <div v-if="editable" class="horizontal-flexbox">
            <input :value="picture.url" @change="setPhoto" type="text" class="no-fixed-width flex-grow-1" />
        </div>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import { Picture, uploadPicture } from "@/datatypes";


export default Vue.extend({
    props: {
        index: Number,
        editable: Boolean,
        picture: Object as PropType<Picture|undefined>,
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
        setPhoto(e: Event & { target: { value: string } }) {
            uploadPicture(e.target.value).then(url => {
                this.$emit("set-photo", { detail: { src: e.target.value, hubUrl: url, index: this.index } })
            });
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
})
</script>