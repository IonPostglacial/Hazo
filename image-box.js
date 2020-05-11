Vue.component("image-box", {
    props: ["photos", "editable"],
    data() {
        return {
            newPhotoUrl: ""
        };
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
    },
    template: `
        <div class="horizontal-flexbox thin-border medium-margin white-background">
            <div v-for="photo, index in photos" class="vertical-flexbox space-between relative">
                <div v-if="editable" v-on:click="deletePhoto(index)" class="close absolute-top-right"></div>
                <a class="small-margin thin-border" href="#1" v-on:click="openPhoto(photo)">
                    <img class="medium-max-width" :src="photo">
                </a>
                <input v-if="editable" type="text" :value="photo" v-on:change="setPhoto(index, e.target.value)" />
            </div>
            <div class="vertical-flexbox space-between relative">
                <div class="small-margin thin-border">
                    <img class="medium-max-width" :src="newPhotoUrl">
                </div>
                <add-item v-if="editable" v-on:add-item="addPhoto" v-model="newPhotoUrl"></add-item>
            </div>
        </div>
    `
});