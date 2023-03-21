<template>
    <HBox>
        <div class="relative inline-block flex-grow-1">
            <input type="text" v-if="!multiline" v-model="text" @keydown.enter="addSingleItem"
                @keydown.up="selectPreviousCompletion"
                @keydown.down="selectNextCompletion"
                class="full-width" placeholder="Add an item" />
            <drop-down v-if="autocomplete && openAutoComplete && completions.length > 0" :open="openAutoComplete" @clickout="openAutoComplete = false">
                <div class="grid-3">
                    <div v-for="(entry, i) in completions" :key="entry.id" class="display-contents">
                        <div v-for="lang in ['S', 'V', 'CN']" :key="lang" :class="['medium-padding', { 'background-color-1': i === selectedCompletion }]">
                            {{ entry[lang] }}
                        </div>
                    </div>
                </div>
            </drop-down>
        </div>
        <textarea type="text" v-if="multiline" v-model="text" class="flex-grow-1 input-text"
            rows="1" placeholder="Add multiple items">
        </textarea>
        <button @click="multiline = !multiline" title="Activate multiline mode">¶</button>
        <button @click="add" title="Add an item" class="background-color-1">Add</button>
    </HBox>
</template>

<script lang="ts">
import DropDown from "@/components/toolkit/DropDown.vue";
import HBox from "@/components/toolkit/HBox.vue";
import { familiesWithNamesLike, Name } from "@/db-index";

export default {
  components: { DropDown, HBox },
    props: {
        value: String,
        autocomplete: Boolean,
    },
    data() {
        return {
            multiline: false,
            text: this.value ?? "",
            openAutoComplete: false,
            completions: [] as Name[],
            selectedCompletion: -1,
        };
    },
    watch: {
        text(val) {
            if (!this.autocomplete) return;
            if (val.length === 0) {
                this.openAutoComplete = false;
                this.selectedCompletion = -1;
            } else {
                this.openAutoComplete = true;
                familiesWithNamesLike("S", this.text).then(n => { this.completions = n; });
            }
        }
    },
    methods: {
        selectPreviousCompletion() {
            if (this.selectedCompletion > 0) {
                this.selectedCompletion--;
            } else {
                this.selectedCompletion = this.completions.length-1;
            }
        },
        selectNextCompletion() {
            if (this.selectedCompletion < this.completions.length-1) {
                this.selectedCompletion++;
            } else {
                this.selectedCompletion = 0;
            }
        },
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
            if (!this.autocomplete || this.selectedCompletion === -1) {
                this.addItem(this.text.split("\t"));
            } else {
                const completed = this.completions[this.selectedCompletion];
                this.addItem([completed.S, completed.V, completed.CN]);
            }
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
};
</script>