<template>
    <div class="horizontal-flexbox">
        <v-text-field dense v-if="!multiline" v-model="text" @keydown.enter="addSingleItem"
            class="flex-grow-1" placeholder="Add an item"></v-text-field>
        <v-textarea outlined background-color="grey lighten-2" v-if="multiline" v-model="text" class="flex-grow-1 input-text"
            rows="1" placeholder="Add multiple items">
        </v-textarea>
        <v-btn icon @click="multiline = !multiline" title="Activate multiline mode"><v-icon>mdi-format-list-text</v-icon></v-btn>
        <v-btn @click="add" color="primary" title="Add an item">Add</v-btn>
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