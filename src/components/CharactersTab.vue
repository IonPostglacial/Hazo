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
            <ImageBox v-if="showImageBox"
                :photos="selectedDescription.photos"
                editable
                v-on:add-photo="addDescriptionPhoto"
                v-on:set-photo="setDescriptionPhoto"
                v-on:delete-photo="deleteDescriptionPhoto"
                v-on:open-photo="openPhoto">
            </ImageBox>
            <ul class="thin-border medium-margin medium-padding white-background flex-grow-1 scroll">
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name FR</label><input class="flex-grow-1" type="text" v-model="selectedDescription.name" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name EN</label><input class="flex-grow-1" type="text" v-model="selectedDescription.nameEN" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name CN</label><input class="flex-grow-1" type="text" v-model="selectedDescription.nameCN" /></div>

                <label class="item-property">Detail</label>
                <textarea v-model="selectedDescription.detail"></textarea><br/>

                <div v-if="selectedDescription.parentId">
                    <label>Inapplicable If</label>
                    <ul class="indented">
                        <li class="medium-padding" v-for="state in descriptions[selectedDescription.parentId].states" :key="state.id">
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
                <div class="scroll thin-border medium-margin medium-padding white-background" style="height: 50%;">
                    <label>States</label>
                    <ul class="indented">
                        <li class="medium-padding" v-for="state in selectedDescription.states || []" :key="state.id">
                            <label class="blue-hover medium-padding">
                                <input type="radio" v-model="selectedState" :value="state.id" name="selected-state">
                                <input type="text" v-model="state.name" />
                            </label>
                        </li>
                        <li>
                            <AddItem v-on:add-item="addState"></AddItem>
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

import { Character } from "../bunga/Character";
import type { State } from "../bunga/State"; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "CharactersTab",
    components: { AddItem, ImageBox, TreeMenu },
    computed: {
        selectedDescription(): Character | undefined {
            return this.descriptions[this.selectedDescriptionId];
        },
        selectedDescriptionState(): State | undefined {
            return this.selectedDescription?.states?.find(s => s.id === this.selectedState);
        },
    },
    data(): { descriptions: Record<string, Character>, selectedDescriptionId: string, selectedState: string } {
        return {
            descriptions: this.initDescriptions ?? {},
            selectedDescriptionId: "",
            selectedState: "",
        };
    },
    props: {
        showLeftMenu: Boolean,
        showImageBox: Boolean,
        initDescriptions: Object,
    },
    methods: {
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
        addDescriptionPhoto(photo: string) {
            this.selectedDescription!.photos.push(photo);
        },
        setDescriptionPhoto(index: number, photo: string) {
            this.selectedDescription!.photos[index] = photo;
        },
        deleteDescriptionPhoto(index: number) {
            this.selectedDescription!.photos.splice(index, 1);
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
            Character.create(this.descriptions, { name: value, parentId, states: [], inapplicableStates: [] });
            const newDescription = Character.create(this.descriptions, {
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
                    if (child instanceof Character) {
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
        addState(value: string) {
            if (typeof this.selectedDescription === "undefined") throw "addState failed: description is undefined.";
            this.selectedDescription.states.push({
                id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                descriptorId: this.selectedDescription.id,
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