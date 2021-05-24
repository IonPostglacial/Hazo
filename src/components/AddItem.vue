<template>
    <div class="horizontal-flexbox">
        <input type="text" v-if="!multiline" v-model="text" @keydown.enter="addSingleItem"
            class="flex-grow-1" placeholder="Add an item" />
        <textarea type="text" v-if="multiline" v-model="text" class="flex-grow-1 input-text"
            rows="1" placeholder="Add multiple items">
        </textarea>
        <button @click="multiline = !multiline" title="Activate multiline mode">¶</button>
        <button @click="add" title="Add an item" class="background-color-1">Add</button>
    </div>
</template>

<script lang="ts">
import Vue from "vue";

export default Vue.extend({
    props: {
        value: String,
    },
    data() {
        return {
            multiline: false,
            text: this.value,
        };
    },
    methods: {
        add() {
            if (this.multiline) {
                this.addMultipleItems();
            } else {
                this.addSingleItem();
            }
        },
        addItem(value: string[]) {
            this.$emit("add-item", { detail: value })
        },
        addSingleItem() {
            this.addItem([this.text]);
            this.text = "";
        },
        addMultipleItems() {
            const linesToAdd = this.text.split("\n").map(name => name.trim());
            for (const line of linesToAdd) {
                const columnsToAdd = line.split("\t").map(c => c.trim());
                if (columnsToAdd.length > 0) {
                    this.addItem(columnsToAdd);
                }
            }
            this.text = "";
            this.multiline = false;
        },
    }
});
</script>