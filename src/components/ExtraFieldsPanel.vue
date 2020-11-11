<template>
    <div v-if="showFields" class="height-full medium-margin thin-border white-background medium-padding horizontal-flexbox fixed-right">
        <ul class="vertical-flexbox scroll">
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
import Vue from "vue";

export default Vue.extend({
    props: { showFields: Boolean, extraFields: Array },
    methods: {
        addExtraField(e: { detail: string }) {
            this.$store.commit("addExtraField", e);
        },
        removeExtraField(id: string) {
            this.$store.commit("removeExtraField", id);
        }
    }
})
</script>