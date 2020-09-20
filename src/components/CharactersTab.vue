<template>
    <div class="horizontal-flexbox start-align flex-grow-1 scroll">
        <nav v-if="showLeftMenu" class="scroll medium-margin thin-border white-background">
            <TreeMenu editable :items="descriptions" name="description"
                :name-fields="['name', 'nameCN']"
                v-on:select-item="selectDescription" :selected-item="selectedDescriptionId"
                v-on:add-item="addDescription"
                v-on:delete-item="deleteDescription">
            </TreeMenu>
        </nav>
        <section v-if="typeof selectedDescription !== 'undefined'" class="vertical-flexbox flex-grow-1">
            <picture-box editable="true"
                    @add-photo="addDescriptionPhoto"
                    @set-photo="setDescriptionPhoto"
                    @delete-photo="deleteDescriptionPhoto"
                    @open-photo="openDescriptionPhoto">
                <picture-frame v-for="(photo, index) in selectedDescription.photos" :key="index"
                    :url="photo" :index="index" editable="true"></picture-frame>
            </picture-box>
            <ul class="thin-border medium-margin medium-padding white-background flex-grow-1 scroll">
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name FR</label><input class="flex-grow-1" type="text" v-model="selectedDescription.name" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name EN</label><input class="flex-grow-1" type="text" v-model="selectedDescription.nameEN" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name CN</label><input class="flex-grow-1" type="text" v-model="selectedDescription.nameCN" /></div>

                <label class="item-property">Detail</label>
                <textarea v-model="selectedDescription.detail"></textarea><br/>

                <div v-if="selectedDescription.parentId">
                    <label>Inapplicable If</label>
                    <ul class="indented">
                        <li class="medium-padding" v-for="state in descriptions.getItemById(selectedDescription.parentId).states" :key="state.id">
                            <label>
                            <input type="checkbox" v-on:change="setInapplicableState(state, $event.target.checked)" :checked="selectedDescription.inapplicableStates.find(s => s.id === state.id)" />
                            {{ state.name }}
                            </label>
                        </li>
                    </ul>
                </div>
            </ul>
        </section>
        <section v-if="typeof selectedDescription !== 'undefined'" class="scroll">
            <div class="relative" style="height: 98%">
                <picture-box v-if="selectedDescriptionState"
                        class="scroll"
                        editable="true"
                        @add-photo="addStatePhoto"
                        @set-photo="setStatePhoto"
                        @delete-photo="deleteStatePhoto"
                        @open-photo="openStatePhoto">
                    <picture-frame v-for="(photo, index) in selectedDescriptionState.photos" :key="index"      
                        :url="photo" :index="index" :editable="true"></picture-frame>
                </picture-box>
                <collapsible-panel label="States">
                    <div class="scroll thin-border medium-margin medium-padding white-background">
                        <ul class="no-list-style medium-padding medium-margin">
                            <li class="medium-padding" v-for="state in selectedDescription.states || []" :key="state.id">
                                <label class="blue-hover medium-padding nowrap">
                                    <input type="radio" v-model="selectedState" :value="state.id" name="selected-state">
                                    <input type="text" v-model="state.name" />
                                </label>
                            </li>
                            <li>
                                <add-item v-on:add-item="addState"></add-item>
                            </li>
                            <li>
                                <button v-if="!showAddMultiple" type="button" class="background-color-1" @click="showAddMultipleStates">Multistate Editor</button><br>
                                <textarea v-if="showAddMultiple" v-model="addMultipleContent"></textarea><br>
                                <button v-if="showAddMultiple" type="button" class="background-color-1" @click="addMultipleStates">Add States</button>
                            </li>
                        </ul>
                    </div>
                </collapsible-panel>
            </div>
        </section>
    </div>
</template>
<script lang="ts">
import TreeMenu from "./TreeMenu.vue";
import { defineComponent, PropType } from "vue";
import { addNewCharacter, Character, Hierarchy, State } from "../bunga"; // eslint-disable-line no-unused-vars
import { createDetailData } from '@/bunga/DetailData';
import { createHierarchicalItem } from '@/bunga/HierarchicalItem';

export default defineComponent({
    name: "CharactersTab",
    components: { TreeMenu },
    computed: {
        selectedDescription(): Character|undefined {
            return this.descriptions?.getItemById(this.selectedDescriptionId);
        },
        selectedDescriptionState(): State|undefined {
            return this.selectedDescription?.states?.find(s => s.id === this.selectedState);
        },
    },
    data() {
        return {
            descriptions: this.initDescriptions,
            selectedDescriptionId: "",
            selectedState: "",
            showAddMultiple: false,
            addMultipleContent: "",
        };
    },
    props: {
        showLeftMenu: Boolean,
        initDescriptions: Hierarchy as PropType<Hierarchy<Character>>,
    },
    methods: {
        showAddMultipleStates() {
            this.showAddMultiple = true;
        },
        addMultipleStates() {
            const statesToAdd = this.addMultipleContent.split("\n").map(name => name.trim());
            for (const state of statesToAdd) {
                if (state !== "") {
                    this.addState({ detail: state });
                }
            }
            this.addMultipleContent = "";
            this.showAddMultiple = false;
        },
        setInapplicableState(state: State, selected: boolean) {
            if (selected) {
                this.selectedDescription!.inapplicableStates.push(state);
            } else {
                const i = this.selectedDescription!.inapplicableStates.findIndex(s => s.id === state.id);
                this.selectedDescription!.inapplicableStates.splice(i, 1);
            }
        },
        selectDescription(id: string) {
            this.selectedDescriptionId = id;
        },
        addDescriptionPhoto(e: {detail: {value: string}}) {
            this.selectedDescription!.photos.push(e.detail.value);
        },
        setDescriptionPhoto(e: {detail: {index: number, value: string}}) {
            this.selectedDescription!.photos[e.detail.index] = e.detail.value;
        },
        deleteDescriptionPhoto(e: {detail: {index: number}}) {
            this.selectedDescription!.photos.splice(e.detail.index, 1);
        },
        addStatePhoto(e: {detail: {value: string}}) {
            if (this.selectedDescriptionState && typeof this.selectedDescriptionState?.photos === "undefined") {
                this.selectedDescriptionState.photos = [];
            }
            this.selectedDescriptionState?.photos.push(e.detail.value);
        },
        setStatePhoto(e: {detail: {index: number, value: string}}) {
            if (this.selectedDescriptionState) {
                this.selectedDescriptionState.photos[e.detail.index] = e.detail.value;
            }
        },
        deleteStatePhoto(e: {detail: {index: number}}) {
            this.selectedDescriptionState?.photos.splice(e.detail.index, 1);
        },
        addDescription({ value, parentId }: { value: string, parentId: string }) {
            if (typeof this.descriptions === "undefined") throw "";

            const newDescription = this.descriptions.addItem({
                ...createHierarchicalItem<Character>({
                    ...createDetailData({ id: "", name: value }),
                    type: "character",
                    parentId: parentId,
                    childrenIds: [],
                }),
                states: [],
                inapplicableStates: []
            });
            const parentDescription = this.descriptions?.getItemById(parentId);
            if(typeof parentDescription !== "undefined") {
                newDescription.inapplicableStates = [...parentDescription.states];
                const newState = {
                    id: "s-auto-" + newDescription.id,
                    descriptorId: parentId, name: newDescription.name, photos: []
                };
                parentDescription.states = [...parentDescription.states, newState];
                for (const child of Object.values(parentDescription.children)) {
                    if (child.id !== newDescription.id) {
                        child.inapplicableStates = [...child.inapplicableStates, newState];
                    }
                }
            }
            this.$emit("change-descriptions", this.descriptions);
        },
        deleteDescription({ itemId }: { itemId: string}) {
            if (typeof this.descriptions === "undefined") throw "";

            const descriptionToDelete = this.descriptions.getItemById(itemId);
            if (typeof descriptionToDelete !== "undefined") {
                this.descriptions.removeItem(descriptionToDelete);
            } else {
                console.warn(`Trying to delete item with id ${itemId} which doesn't exist.`, this.descriptions);
            }
        },
        addState({detail} : {detail: string}) {
            if (typeof this.selectedDescription === "undefined") throw "addState failed: description is undefined.";
            this.selectedDescription.states.push({
                id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                descriptorId: this.selectedDescription.id,
                name: detail,
                photos: []
            });
        },
        openDescriptionPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.selectedDescription!.photos});
        },
        openStatePhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.selectedDescriptionState?.photos});
        },
    }
});
</script>