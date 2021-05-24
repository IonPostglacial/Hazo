<template>
    <div class="nowrap">
        <img v-if="icon" width="18" height="18" :src="'icons/'+icon" alt="">
        <label class="item-property"><slot></slot></label>
        <div v-if="!editable" class="inline-block medium-padding medium-margin" target="_blank">{{ text }}</div>
        <input v-if="editable" type="text" :value="text" @input="setValue" />
        <button v-if="editable" @click="pushToChildren" title="Push the value to children">🡆</button>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: {
        editable: Boolean,
        icon: String,
        value: String,
    },
    data() {
        return {
            text: this.value,
        };
    },
    methods: {
        setValue(e: Event & { target: { value: string } }) {
            this.text = e.target.value;
            this.$emit("input", this.text);
        },
        pushToChildren() {
            this.$emit("push-to-children", { detail: this.text });
        }
    }
});
</script>