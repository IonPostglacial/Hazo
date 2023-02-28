<template>
    <div v-if="showFields" class="absolute over-everything full-width medium-margin thin-border white-background vertical-flexbox">
        <header class="horizontal-flexbox medium-padding background-gradient-1 thin-border">
            <div class="nowrap no-vertical-overflow flex-grow-1">Extra Fields</div><div class="close" @click="close"></div>
        </header>
        <ul class="vertical-flexbox medium-padding scroll">
            <li v-for="field in extraFields" :key="field.id" class="horizontal-flexbox">
                <label class="nowrap">
                    Id:&nbsp;
                    <input type="text" v-model="field.id">
                </label>
                <label class="nowrap">
                    Label:&nbsp;
                <input type="text" v-model="field.label">
                </label>
                <label class="nowrap">
                    Icon:&nbsp;
                <input type="text" v-model="field.icon">
                </label>
                <div class="close" style="width: 42px;" @click="removeExtraField(field.id)">&nbsp;</div>
            </li>
            <add-item @add-item="addExtraField"></add-item>
        </ul>
    </div>
</template>

<script lang="ts">
import Vue, { PropType } from "vue";
import AddItem from "./AddItem.vue";
import { Field } from "@/datatypes";

export default {
    components: { AddItem },
    props: { showFields: Boolean, extraFields: Array as PropType<Field[]> },
    data() {
        return {
            store: Hazo.store,
        }
    },
    methods: {
        addExtraField(e: { detail: string[] }) {
            this.store.do("addExtraField", { detail: e.detail[0] });
        },
        removeExtraField(id: string) {
            this.store.do("removeExtraField", id);
        },
        close() {
            this.$emit("closed");
        },
    }
}
</script>