<template>
  <VBox class="thin-border medium-margin white-background flex-grow-1">
        <HBox>
            <b class="flex-grow-1 medium-margin">{{ label }}</b>
            <VBox @click="open = !open" class="small-square blue-circle-hover thin-margin flex-centered">
                <div :class="open ? 'bottom-arrow' : 'left-arrow'">&nbsp;</div>
            </VBox>
        </HBox>
        <div :class="open ? '' : 'invisible'">
            <slot></slot>
        </div>
    </VBox>
</template>

<script lang="ts">
import HBox from './HBox.vue';
import VBox from './VBox.vue';


export default {
    components: { HBox, VBox },
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