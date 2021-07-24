<template>
    <div class="display-contents">
        <img v-if="icon" width="18" height="18" :src="'icons/'+icon" alt="">
        <label><slot></slot></label>
        <div v-if="!editable" class="inline-block medium-padding medium-margin" target="_blank">{{ text }}</div>
        <input v-if="editable" type="text" :value="value" @input="setValue" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    props: {
        editable: Boolean,
        icon: String,
        value: String,
    },
    methods: {
        setValue(e: Event & { target: { value: string } }) {
            this.$emit("input", e.target.value);
        },
    }
});
</script>