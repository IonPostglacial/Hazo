<template>
    <collapsible-panel label="Pictures" class="centered-text thin-border medium-margin white-background wrap-flexbox">
        <div v-for="(photo, index) in photos" :key="photo" class="vertical-flexbox space-between relative">
            <div v-if="editable" v-on:click="deletePhoto(index)" class="close absolute-top-right"></div>
            <a class="small-margin thin-border" href="#1" v-on:click="openPhoto(index)">
                <img class="medium-max-width medium-max-height" :src="photo">
            </a>
            <input v-if="editable" type="text" :value="photo" v-on:change="setPhoto(index, e.target.value)" />
        </div>
        <div class="vertical-flexbox space-between relative">
            <add-item v-if="editable" v-on:add-item="addPhoto"></add-item>
        </div>
    </collapsible-panel>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    name: "ImageBox",
    props: { photos: Array, editable: Boolean },
    methods: {
        deletePhoto(index: number) {
            this.$emit("delete-photo", index);
        },
        openPhoto(index: number) {
            this.$emit("open-photo", { photos: this.photos, index });
        },
        setPhoto(index: number, photoUrl: string) {
            this.$emit("set-photo", { index, url: photoUrl });
        },
        addPhoto({detail}: {detail: string}) {
            this.$emit("add-photo", detail);
        },
    }
});
</script>