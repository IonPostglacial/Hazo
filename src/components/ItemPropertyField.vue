<template>
    <div class="display-contents">
        <img v-if="icon" width="18" height="18" :src="'icons/'+icon" alt="">
        <label><slot></slot></label>
        <input type="text" :value="modelValue" @input="setValue" />
    </div>
</template>

<script lang="ts">
export default {
    props: {
        icon: String,
        modelValue: String,
    },
    methods: {
        setValue(e: Event) {
            if (e.target instanceof HTMLInputElement) {
                this.$emit("update:modelValue", e.target.value);
            }
        },
    }
};
</script>