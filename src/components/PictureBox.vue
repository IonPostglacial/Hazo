<template>
    <div class="wrap-flexbox">
        <picture-frame v-if="picture" :key="picture.id"
            :editable="editable"
            :index="selectedPhotoIndex"
            :picture="picture"
            @delete-photo="deletePicture"
            @open-photo="openPhoto"
            @set-photo="setPhoto">
        </picture-frame>
        <div class="horizontal-flexbox">
            <v-btn icon @click="previousPicture"><v-icon>mdi-arrow-left</v-icon></v-btn>
            <v-btn icon @click="nextPicture"><v-icon>mdi-arrow-right</v-icon></v-btn>
            <div class="medium-padding">{{ indexText }}</div>
            <v-btn icon @click="uploadPopup"><v-icon>mdi-upload</v-icon></v-btn>
            <div v-if="displayUploadPopup" class="absolute over-everything thin-border medium-padding white-background">
                <label>
                    <input type="file" @change="uploadPicture" />
                    <label for="uploadPicture" class="button background-color-1">Upload</label>
                </label>
            </div>
            <add-item @add-item="addPicture" :value="addPictureUrl" class="flex-grow-1"></add-item>
        </div>
    </div>
</template>

<script lang="ts">
import { Picture } from "@/datatypes";
import Vue, { PropType } from "vue";
import AddItem from "./AddItem.vue";
import PictureFrame from "./PictureFrame.vue";
import CollapsiblePanel from "./CollapsiblePanel.vue";
import { Config } from "@/tools/config";
import { uploadPicture } from "@/datatypes/picture";

export default Vue.extend({
  components: { AddItem, CollapsiblePanel, PictureFrame },
    props: {
        editable: Boolean,
        pictures: Array as PropType<Picture[]|undefined>
    },
    data() {
        return {
            selectedPhotoIndex: 0,
            displayUploadPopup: false,
            addPictureUrl: "",
        };
    },
    computed: {
        pics(): Picture[] {
            return this.pictures ?? [];
        },
        indexText(): string {
            return this.pics.length > 1 ? `${this.selectedPhotoIndex + 1} / ${this.pics.length}` : "";
        },
        picture(): Picture {
            return this.pics[this.selectedPhotoIndex];
        }
    },
    methods: {
        previousPicture() {
            if (this.selectedPhotoIndex > 0) this.selectedPhotoIndex--;
        },
        nextPicture() {
            if (this.selectedPhotoIndex < this.pics.length - 1) this.selectedPhotoIndex++;
        },
        uploadPopup() {
            this.displayUploadPopup = !this.displayUploadPopup;
        },
        async uploadPicture(e : Event & { target: HTMLInputElement }) {
            if (e.target?.files?.length ?? 0 > 0) {
                const fileToUpload = e.target!.files![0];
                const data = new FormData();
                data.append("file", fileToUpload, Math.random() * 1E6 + fileToUpload.name);
                try {
                    const res = await fetch(Config.datasetRegistry + "api/upload-img", {
                        method: "POST",
                        body: data,
                    });
                    const json = await res.json();
                    this.addPictureUrl = Config.datasetRegistry + encodeURI(json.url);
                } catch {
                    0 === 0;
                }
            }
            this.displayUploadPopup = false;
        },
        addPicture(ev: Event & { detail: string[] }) {
            this.$emit("add-photo", { detail: { value: ev.detail } });
            console.log("before", this.selectedPhotoIndex);
            this.selectedPhotoIndex = this.pictures?.length ?? 0 - 1;
            console.log("after", this.selectedPhotoIndex);
            const oldIndex = this.selectedPhotoIndex;
            for (const remoteUrl of ev.detail) {
                uploadPicture(remoteUrl).then(url => {
                    this.$emit("set-photo", { detail: { src: remoteUrl, hubUrl: url, index: oldIndex } })
                });
            }
        },
        deletePicture(e: Event & { detail: string[] }) {
            this.$emit("delete-photo", e);
            if (this.selectedPhotoIndex > 0) {
                this.selectedPhotoIndex--;
            }
        },
        openPhoto(e: Event) {
            this.$emit("open-photo", e);
        },
        setPhoto(e: Event) {
            this.$emit("set-photo", e);
        }
    }
})
</script>