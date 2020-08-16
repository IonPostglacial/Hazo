<template>
    <div>
        <label class="item-property"><slot></slot></label>
        <input v-if="editable" type="text" v-model="item[property]" />
        <div class="inline-block medium-padding medium-margin"  v-if="!editable" target="_blank">{{ item[property] }}</div>
        <button v-if="editable" title="Push the value to children" v-on:click="pushToChildren">🡆</button>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: {
        editable: Boolean,
        item: Object,
        property: String,
    },
    methods: {
        pushToChildren() {
            for (const child of Object.values(this.item.children)) {
                const anyChild: any = child, anyItem: any = this.item;
                anyChild[this.property] = anyItem[this.property];
            }
        },
    },
});
</script>