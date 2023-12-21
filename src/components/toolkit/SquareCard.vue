<template>
    <div class="medium-square relative vertical-flexbox white-background full-background button"
        :style="image ? 'background-image: url(' + image + ')' : ''">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">

const { image } = defineProps({ image: String });
</script>