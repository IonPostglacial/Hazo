<template>
    <HBox>
        <div class="relative inline-block flex-grow-1">
            <input type="text" v-if="!multiline" v-model="text" @keydown.enter="addSingleItem"
                @keydown.up="selectPreviousCompletion"
                @keydown.down="selectNextCompletion"
                class="full-width" placeholder="Add an item" />
            <drop-down v-if="nameStore && openAutoComplete && completions.length > 0" :open="openAutoComplete" @clickout="openAutoComplete = false">
                <div :class="'grid-n grid-' + nameFields?.length ?? 1">
                    <div v-for="(entry, i) in completions" :key="entry.id" class="display-contents blue-hover-line">
                        <div v-for="lang in nameFields" :key="lang.propertyName" @click="selectAndEnter(i)" :class="['cell', 'clickable', 'medium-padding', { 'background-color-1': i === selectedCompletion }]">
                            {{ capitalizeFirstLetter(entry.values[lang.propertyName]) }}
                        </div>
                    </div>
                </div>
            </drop-down>
        </div>
        <textarea type="text" v-if="multiline" v-model="text" class="flex-grow-1 input-text"
            rows="1" placeholder="Add multiple items">
        </textarea>
        <button @click="multiline = !multiline" title="Activate multiline mode">
            <font-awesome-icon icon="fa-solid fa-file-lines" />
        </button>
        <button @click="add" title="Add an item" class="background-color-1">
            <font-awesome-icon icon="fa-solid fa-plus" />
        </button>
    </HBox>
</template>

<script lang="ts">
import DropDown from "@/components/toolkit/DropDown.vue";
import HBox from "@/components/toolkit/HBox.vue";
import { NameStore, Completion } from "@/db-index";
import { PropType } from "vue";

export default {
  components: { DropDown, HBox },
    props: {
        value: String,
        nameStore: Object as PropType<NameStore>,
        nameFields: Array as PropType<Array<{ label: string, propertyName: string }>>,
    },
    data() {
        return {
            multiline: false,
            text: this.value ?? "",
            openAutoComplete: false,
            completions: [] as Completion[],
            selectedCompletion: -1,
        };
    },
    watch: {
        async text(val) {
            if (!this.nameStore) return;
            if (val.length === 0) {
                this.openAutoComplete = false;
                this.selectedCompletion = -1;
            } else {
                this.openAutoComplete = true;
                const c = await this.nameStore?.namesLike(this.text);
                this.completions = c ?? [];
            }
        }
    },
    methods: {
        capitalizeFirstLetter(s: string|undefined) {
            if (typeof s === "undefined") { return ""; }
            return s.charAt(0).toUpperCase() + s.slice(1);
        },
        selectAndEnter(i: number) {
            this.selectedCompletion = i;
            this.addSingleItem();
        },
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
            if (!this.nameStore || this.selectedCompletion === -1) {
                this.addItem(this.text.split("\t"));
            } else {
                const completed = this.completions[this.selectedCompletion];
                const nameFields = this.nameFields;
                if (typeof nameFields !== "undefined") {
                    console.log(completed);
                    this.addItem(nameFields.map(f => this.capitalizeFirstLetter(completed.values[f.propertyName])));
                }
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