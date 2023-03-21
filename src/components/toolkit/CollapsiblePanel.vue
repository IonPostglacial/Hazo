<template>
  <div class="vertical-flexbox thin-border medium-margin white-background vertical-flexbox flex-grow-1">
        <div class="horizontal-flexbox">
            <b class="flex-grow-1 medium-margin">{{ label }}</b>
            <label @click="open = !open" class="small-square blue-circle-hover thin-margin vertical-flexbox flex-centered">
                <div :class="open ? 'bottom-arrow' : 'left-arrow'">&nbsp;</div>
            </label>
        </div>
        <div :class="open ? '' : 'invisible'">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: {
        label: String,
    },
    data() {
        return {
            open: true,
        }
    }
};
</script>