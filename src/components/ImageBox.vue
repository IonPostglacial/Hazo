<template>
    <div class="centered-text thin-border medium-margin white-background wrap-flexbox">
        <div v-for="(photo, index) in photos" :key="index" class="vertical-flexbox space-between relative">
            <div v-if="editable" v-on:click="deletePhoto(index)" class="close absolute-top-right"></div>
            <a class="small-margin thin-border" href="#1" v-on:click="openPhoto(photo)">
                <img class="medium-max-width medium-max-height" :src="photo">
            </a>
            <input v-if="editable" type="text" :value="photo" v-on:change="setPhoto(index, e.target.value)" />
        </div>
        <div class="vertical-flexbox space-between relative">
            <div class="small-margin thin-border">
                <img class="medium-max-width medium-max-height" :src="newPhotoUrl">
            </div>
            <AddItem v-if="editable" v-on:add-item="addPhoto" v-model="newPhotoUrl"></AddItem>
        </div>
    </div>    
</template>

<script>
import AddItem from "./AddItem.vue";

export default {
    name: "ImageBox",
    props: { photos: Array, editable: Boolean },
    data() {
        return {
            newPhotoUrl: ""
        };
    },
    components: {
        AddItem
    },
    methods: {
        deletePhoto(index) {
            this.$emit("delete-photo", index);
        },
        openPhoto(photoUrl) {
            this.$emit("open-photo", photoUrl);
        },
        setPhoto(index, photoUrl) {
            this.$emit("set-photo", { index, url: photoUrl });
        },
        addPhoto() {
            this.$emit("add-photo", this.newPhotoUrl);
            this.newPhotoUrl = "";
        },
    }
}
</script>