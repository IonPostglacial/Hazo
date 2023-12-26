<template>
    <HBox>
        <div class="relative inline-block flex-grow-1">
            <input type="text" v-if="!multiline" v-model="text" @keydown.enter="addSingleItem"
                @keydown.up="selectPreviousCompletion"
                @keydown.down="selectNextCompletion"
                class="full-width" placeholder="Add an item" />
            <drop-down v-if="nameStore && openAutoComplete && completions.length > 0" :open="openAutoComplete" @clickout="openAutoComplete = false">
                <div class="grid-n grid-2-autocomplete stretch-items">
                    <div v-for="(entry, i) in completions" :key="i" class="display-contents blue-hover-line">
                        <VBox v-if="nameFields && nameFields.length > 0"  @click="selectAndEnter(i)" :class="['nowrap', 'cell', 'clickable', 'medium-padding', { 'background-color-1': i === selectedCompletion }]">
                            <div :key="nameFields[0].propertyName" class="main-name">
                                {{ entry[nameFields[0].propertyName] }}
                            </div>
                            <HBox class="gap-1">
                                <div v-for="lang in nameFields.slice(1)" :key="lang.propertyName" class="secondary-name">
                                    {{ entry[lang.propertyName] }}
                                </div>
                            </HBox>
                        </VBox>
                        <HBox @click="selectAndEnter(i)" :class="['cell', 'center-items', 'clickable', 'origin-name', { 'background-color-1': i === selectedCompletion }]">
                            <div>
                                {{ entry.origin }}
                            </div>
                        </HBox>
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
import VBox from "@/components/toolkit/VBox.vue";
import { WordStore, Completion, Language } from "@/db-index";
import { PropType } from "vue";

export default {
  components: { DropDown, HBox, VBox },
    props: {
        value: String,
        nameStore: Object as PropType<WordStore>,
        nameFields: Array as PropType<Array<{ label: string, propertyName: Language }>>,
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
                    this.addItem(nameFields.map(f => completed[f.propertyName]));
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

<style scoped>
    .grid-2-autocomplete {
        grid-template-columns: 1fr 10ch;
    }

    .origin-name {
        font-style: italic;
        color: grey;
    }

    .main-name {
        font-size: 1.2em;
    }

    .secondary-name {
        font-size: 0.8em;
    }
</style>