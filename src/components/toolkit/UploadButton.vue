<template>
    <button type="button" @click="uploadFile"><slot></slot></button>
    <input ref="opener" class="invisible" @change="fileUpload" type="file" :name="name" :accept="accept">
</template>

<script setup lang="ts">
import { ref } from 'vue';

const { accept, name } = defineProps({ accept: String, name: String });
const emit = defineEmits(["upload"]);
const opener = ref<HTMLButtonElement>();

function uploadFile(_: Event) {
    opener?.value?.click();
}

function fileUpload(e: Event) {
    if (!(e.target instanceof HTMLInputElement)) { return; }
    if (e.target.files === null || e.target.files.length === 0) { return; }

    emit("upload", e.target.files[0]);
}
</script>