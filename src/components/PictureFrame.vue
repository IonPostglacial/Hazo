<template>
    <div class="vertical-flexbox space-between relative">
        <div v-if="editable" @click="deletePhoto" class="close white absolute-top-right"></div>
        <a @click="openPhoto" class="small-margin thin-border fill dark-background" href="#1">
            <img :src="picture.url" :alt="picture.label">
        </a>
        <div v-if="editable" class="horizontal-flexbox">
            <input :value="picture.url" @change="setPhoto" type="text" class="no-fixed-width flex-grow-1" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { Picture } from "@/datatypes";
import { Config } from "@/tools/config";

async function photoSelected(photoUrl: string) {
    if (photoUrl.startsWith(Config.datasetRegistry)) {
        return photoUrl;
    } else {
        const res = await fetch(Config.datasetRegistry + "api/upload-img.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: "file-url=" + encodeURI(photoUrl),
        });
        if (res.ok) {
            const json = await res.json();
            if (json.status === "ok") {
                return Config.datasetRegistry + encodeURI(json.url);
            } else {
                return photoUrl;
            }
        } else {
            return photoUrl;
        }
    }
}

export default defineComponent({
    props: {
        index: Number,
        editable: Boolean,
        picture: Object as PropType<Picture|undefined>,
    },
    methods: {
        deletePhoto() {
            this.$emit("delete-photo", { detail: { index: this.index } });
        },
        openPhoto() {
            this.$emit("open-photo", { detail: { index: this.index } });
        },
        setPhoto(e: Event & { target: { value: string } }) {
            photoSelected(e.target.value).then(url => {
                this.$emit("set-photo", { detail: { value: url, index: this.index } })
            });
        },
    }
})
</script>