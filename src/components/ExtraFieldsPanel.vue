<template>
    <div v-if="showFields" class="absolute over-everything full-width medium-margin thin-border white-background vertical-flexbox">
        <HBox class="medium-padding background-gradient-1 thin-border">
            <div class="nowrap no-vertical-overflow flex-grow-1">Extra Fields</div><div class="close" @click="close"></div>
        </HBox>
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
                <div class="close" style="width: 42px;" @click="removeExtraFieldHandler(field.id)">&nbsp;</div>
            </li>
            <add-item @add-item="addExtraFieldHandler"></add-item>
        </ul>
    </div>
</template>

<script lang="ts">
import { PropType } from "vue";
import AddItem from "./toolkit/AddItem.vue";
import HBox from "./toolkit/HBox.vue";
import { Field } from "@/datatypes";
import { mapActions } from "pinia";
import { useDatasetStore } from "@/stores/dataset";

export default {
    components: { AddItem, HBox },
    props: { showFields: Boolean, extraFields: Array as PropType<Field[]> },
    methods: {
        ...mapActions(useDatasetStore, ["addExtraField", "removeExtraField"]),
        addExtraFieldHandler(e: { detail: string[] }) {
            this.addExtraField({ detail: e.detail[0] });
        },
        removeExtraFieldHandler(id: string) {
            this.removeExtraField(id);
        },
        close() {
            this.$emit("closed");
        },
    }
}
</script>