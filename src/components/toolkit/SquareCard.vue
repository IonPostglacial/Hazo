<template>
    <div class="relative vertical-flexbox white-background button" :style="color?('background-color:'+color):''">
        <div class="absolute square-card-inner vertical-flexbox">
            <slot name="background">
                <div class="full-background flex-grow-1" :style="image ? 'background-image: url(' + image + ')' : ''">
                    &nbsp;
                </div>
            </slot>
        </div>
        <div class="absolute square-card-inner center-items">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">

defineProps({ image: String, color: String });
</script>

<style>
    .square-card-inner {
        left: 5%;
        top: 5%;
        width: 90%;
        height: 90%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
</style>