<template>
    <div class="horizontal-flexbox">
        <input class="flex-grow-1" type="text" v-model="text" v-on:keydown.enter="addItem" v-on:input="$emit('input', $event.target.value)" />
        <button class="background-color-1" v-on:click="addItem">
            Add
        </button>
    </div>
</template>

<script>
export default {
    name: "AddItem",
    data() {
        return {
            text: ""
        };
    },
    props: ["onAdd"],
    methods: {
        addItem() {
            const val = this.text;
            this.text = "";
            this.$emit("add-item", val);
        }
    }
}
</script>