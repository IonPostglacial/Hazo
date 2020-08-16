<template>
    <div class="horizontal-flexbox start-align flex-grow-1 scroll">
        <nav v-if="showLeftMenu" class="scroll medium-margin thin-border white-background">
            <TreeMenu editable :items="descriptions" name="description"
                :name-fields="['name', 'nameCN']"
                v-on:select-item="selectDescription" :selected-item="selectedDescription"
                v-on:add-item="addDescription"
                v-on:delete-item="deleteDescription">
            </TreeMenu>
        </nav>
        <section v-if="typeof descriptions[selectedDescription] !== 'undefined'" class="vertical-flexbox flex-grow-1">
            <ImageBox v-if="showImageBox"
                :photos="descriptions[selectedDescription].photos"
                editable
                v-on:add-photo="addDescriptionPhoto"
                v-on:set-photo="setDescriptionPhoto"
                v-on:delete-photo="deleteDescriptionPhoto"
                v-on:open-photo="openPhoto">
            </ImageBox>
            <ul class="thin-border medium-margin medium-padding white-background flex-grow-1 scroll">
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name FR</label><input class="flex-grow-1" type="text" v-model="descriptions[selectedDescription].name" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name EN</label><input class="flex-grow-1" type="text" v-model="descriptions[selectedDescription].nameEN" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name CN</label><input class="flex-grow-1" type="text" v-model="descriptions[selectedDescription].nameCN" /></div>

                <label class="item-property">Detail</label>
                <textarea v-model="descriptions[selectedDescription].detail"></textarea><br/>

                <div v-if="descriptions[selectedDescription].inapplicableStates.length > 0">
                    <label>Inapplicable If</label>
                    <ul class="indented">
                        <li class="medium-padding" v-for="state in descriptions[selectedDescription].inapplicableStates" :key="state.id">
                            {{ descriptions[state.descriptorId].name }} IS {{ state.name }}
                        </li>
                    </ul>
                </div>
            </ul>
        </section>
        <section v-if="typeof descriptions[selectedDescription] !== 'undefined'" class="scroll">
            <div class="relative" style="height: 98%">
                <div class="scroll thin-border medium-margin medium-padding white-background" style="height: 50%;">
                    <label>States</label>
                    <ul class="indented">
                        <li class="medium-padding" v-for="state in descriptions[selectedDescription].states || []" :key="state.id">
                            <label class="blue-hover medium-padding">
                                <input type="radio" v-model="selectedState" :value="state.id" name="selected-state">
                                <input type="text" v-model="state.name" />
                            </label>
                        </li>
                        <li>
                            <AddItem v-on:add-item="addState(descriptions[selectedDescription], $event)"></AddItem>
                        </li>
                    </ul>
                </div>
                <ImageBox v-if="showImageBox && selectedDescriptionState"
                    style="height: 50%;"
                    class="scroll"
                    :photos="selectedDescriptionState.photos"
                    editable
                    v-on:add-photo="addStatePhoto"
                    v-on:set-photo="setStatePhoto"
                    v-on:delete-photo="deleteStatePhoto"
                    v-on:open-photo="openPhoto">
                </ImageBox>
            </div>
        </section>
    </div>
</template>
<script lang="ts">
import TreeMenu from "./TreeMenu.vue";
import AddItem from "../components/AddItem.vue";
import ImageBox from "../components/ImageBox.vue";
import Vue from "vue";

import type { bunga_Character as Character, bunga_State as State } from "../libs/SDD"; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "CharactersTab",
    components: { AddItem, ImageBox, TreeMenu },
    computed: {
        selectedDescriptionState(): State | undefined {
            return this.descriptions[this.selectedDescription]?.states?.find(s => s.id === this.selectedState);
        },
    },
    data(): { descriptions: Record<string, Character>, selectedDescription: string, selectedState: string } {
        return {
            descriptions: this.initDescriptions ?? {},
            selectedDescription: "",
            selectedState: "",
        };
    },
    props: {
        showLeftMenu: Boolean,
        showImageBox: Boolean,
        initDescriptions: Object,
    },
    methods: {
        selectDescription(id: string) {
            this.selectedDescription = id;
        },
        addDescriptionPhoto(photo: string) {
            this.descriptions[this.selectedDescription].photos.push(photo);
        },
        setDescriptionPhoto(index: number, photo: string) {
            this.descriptions[this.selectedDescription].photos[index] = photo;
        },
        deleteDescriptionPhoto(index: number) {
            this.descriptions[this.selectedDescription].photos.splice(index, 1);
        },
        addStatePhoto(photo: string) {
            if (this.selectedDescriptionState && typeof this.selectedDescriptionState?.photos === "undefined") {
                this.selectedDescriptionState.photos = [];
            }
            this.selectedDescriptionState?.photos.push(photo);
        },
        setStatePhoto(index: number, photo: string) {
            if (this.selectedDescriptionState) {
                this.selectedDescriptionState.photos[index] = photo;
            }
        },
        deleteStatePhoto(index: number) {
            this.selectedDescriptionState?.photos.splice(index, 1);
        },
        addDescription({ value, parentId }: { value: string, parentId: string }) {
            window.bunga.Character.create(this.descriptions, { name: value, parentId, states: [], inapplicableStates: [] });
            const newDescription = window.bunga.Character.create(this.descriptions, {
                name: value,
                parentId: parentId,
                states: [],
                inapplicableStates: []
            });
            this.descriptions = { ...this.descriptions, [newDescription.id]: newDescription };
            if(typeof parentId !== "undefined") {
                const parentDescription = this.descriptions[parentId];
                newDescription.inapplicableStates = [...parentDescription.states];
                const newState = {
                    id: "s-auto-" + newDescription.id,
                    descriptorId: parentId, name: newDescription.name, photos: []
                };
                parentDescription.states = [...parentDescription.states, newState];
                for (const child of Object.values(parentDescription.children)) {
                    if (child instanceof window.bunga.Character) {
                        child.inapplicableStates = [...child.inapplicableStates, newState];
                    }
                }
                parentDescription.children = Object.assign({}, this.descriptions[parentId].children, {
                    [newDescription.id]: newDescription
                });
            }
            this.$emit("change-descriptions", this.descriptions);
        },
        deleteDescription({ parentId, itemId }: { parentId: string, itemId: string}) {
            if (typeof parentId !== "undefined") {
                Vue.delete(this.descriptions[parentId].children, itemId);
            }
            Vue.delete(this.descriptions, itemId);
        },
        addState(description: Character, value: string) {
            if (typeof description === "undefined") throw "addState failed: description is undefined.";
            description.states.push({
                id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                descriptorId: description.id,
                name: value,
                photos: []
            });
        },
        openPhoto(e: { photos: string[], index: number }) {
            this.$emit("open-photo", e);
        },
    }
});
</script>