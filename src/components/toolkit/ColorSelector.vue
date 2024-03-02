<template>
    <DropDownButton :label="modelValue">
        <template v-slot:label>
            <div :style="'background-color:'+modelValue" class="button">&nbsp;</div>
        </template>
        <VBox>
            <HBox>
                <button v-for="color in props.palette"
                    @click="modelValue = color"
                    :style="'background-color:'+color">
                    &nbsp;
                </button>
            </HBox>
            <input type="text" v-model="modelValue">
        </VBox>
    </DropDownButton>
</template>

<script setup lang="ts">
import { PropType, defineModel } from "vue";
import DropDownButton from "./DropDownButton.vue";
import HBox from "./HBox.vue";
import VBox from "./VBox.vue";

const props = defineProps({ palette: { type: Array as PropType<string[]>, required: true } });
const modelValue = defineModel({ type: String, required: true });
</script>