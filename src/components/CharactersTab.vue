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
                            <add-item v-on:add-item="addState"></add-item>
                        </li>
                    </ul>
                </div>
                <picture-box v-if="selectedDescriptionState"
                        style="height: 50%;"
                        class="scroll"
                        editable="true"
                        @add-photo="addStatePhoto"
                        @set-photo="setStatePhoto"
                        @delete-photo="deleteStatePhoto"
                        @open-photo="openStatePhoto">
                    <picture-frame v-for="(photo, index) in selectedDescriptionState.photos" :key="index"      
                        :url="photo" :index="index" :editable="true"></picture-frame>
                </picture-box>
            </div>
        </section>
    </div>
</template>
<script lang="ts">
import TreeMenu from "./TreeMenu.vue";
import Vue from "vue";
import { addNewCharacter, Character, State } from "../bunga"; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "CharactersTab",
    components: { TreeMenu },
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
            const newDescription = addNewCharacter(this.descriptions, {
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
                    child.inapplicableStates = [...child.inapplicableStates, newState];
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