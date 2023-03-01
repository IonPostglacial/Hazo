<template>
    <div class="horizontal-flexbox flex-centered">
        <div :class="['min-width-s', { 'selected-column': selected }]">{{name}}</div>
        <div class="button-group">
            <button @click="zoom" :disabled="!magnifyable">
                <font-awesome-icon icon="fa-solid fa-magnifying-glass" />
            </button>
            <button v-if="!selected" @click="add" class="background-color-ok">
                <font-awesome-icon icon="fa-solid fa-plus" />
            </button>
            <button v-if="selected" @click="remove">
                <font-awesome-icon icon="fa-solid fa-minus" />
            </button>
        </div>
    </div>
</template>

<script lang="ts">
export default {
    props: {
        name: String,
        value: String,
        selected: Boolean,
        magnifyable: Boolean,
    },
    methods: {
        zoom() {
            this.$emit("zoom-column", this.value);
        },
        add() {
            this.$emit("add-column", this.value);
        },
        remove() {
            this.$emit("remove-column", this.value);
        }
    }
}
</script>