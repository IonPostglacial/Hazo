<template>
    <div class="vertical-flexbox space-between relative">
        <v-btn icon v-if="editable" @click="deletePhoto" small class="absolute-top-right" color="error"><v-icon>mdi-delete</v-icon></v-btn>
        <a @click="openPhoto" class="small-margin thin-border fill dark-background" href="#1">
            <img :src="url" :alt="picture.label">
        </a>
        <v-btn color="primary" v-if="isRemoteUrl && isConnectedToHub" @click="uploadPhoto">Retrieve Photo</v-btn>
        <div v-if="editable" class="horizontal-flexbox">
            <v-text-field :value="picture.url" @change="setPhoto"></v-text-field>
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
        picture: Object as PropType<Picture>,
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