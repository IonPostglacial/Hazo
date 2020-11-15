<template>
    <div class="horizontal-flexbox start-align flex-grow-1 scroll">
        <nav v-if="showLeftMenu" class="scroll thin-border white-background">
            <TreeMenu editable :items="charactersHierarchy" name="description"
                :name-fields="[{ label: 'Name', propertyName: 'name'}, { label: '中文名', propertyName: 'nameCN' }]"
                @select-item="selectCharacter" :selected-item="selectedCharacter ? selectedCharacter.id : ''"
                @add-item="addCharacter"
                @delete-item="deleteCharacter">
            </TreeMenu>
        </nav>
        <section v-if="typeof selectedCharacter !== 'undefined'" class="scroll vertical-flexbox flex-grow-1">
            <div class="horizontal-flexbox medium-padding thin-border">
                <button type="button" @click="showLeftMenu = !showLeftMenu">Left Menu</button>
                <div class="flex-grow-1 medium-padding">{{ selectedCharacter.name }}</div>
            </div>
            <picture-box editable="editable"
                    @add-photo="addCharacterPhoto"
                    @set-photo="setCharacterPhoto"
                    @delete-photo="deleteCharacterPhoto"
                    @open-photo="openDescriptionPhoto">
                <picture-frame v-for="(photo, index) in selectedCharacter.photos" :key="photo.id"
                    :pictureid="photo.id" :url="photo.url" :label="photo.label" :index="index" editable="true"></picture-frame>
            </picture-box>
            <collapsible-panel label="Identification">
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name FR</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.name" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name EN</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.nameEN" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name CN</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.nameCN" /></div>
                <label class="item-property">Detail</label>
                <textarea class="input-text" v-model="selectedCharacter.detail"></textarea> 
            </collapsible-panel>
            <collapsible-panel v-if="selectedCharacter.parentId" label="Dependencies">
                <div class="horizontal-flexbox">
                    <section class="medium-margin medium-padding thin-border flex-grow-1">
                        <label>Inherent State</label>
                        <ul class="indented no-list-style">
                            <li class="medium-padding" v-for="state in parentStates" :key="state.id">
                                <label>
                                    <input type="radio" :checked="selectedCharacter.inherentState ? selectedCharacter.inherentState.id === state.id : false" name="inherent-state" @change="setInherentState(state)" />
                                    {{ state.name }}
                                </label>
                            </li>
                        </ul>
                    </section>
                    <section class="medium-margin medium-padding thin-border flex-grow-1">
                        <label>Only Applicable If</label>
                        <ul class="indented no-list-style">
                            <li class="medium-padding" v-for="state in parentStatesExceptInherent" :key="state.id">
                                <label>
                                    <input type="checkbox" @change="setRequiredState(state, $event.target.checked)" :checked="selectedCharacter.requiredStates.find(s => s.id === state.id)" />
                                    {{ state.name }}
                                </label>
                            </li>
                        </ul>
                    </section>
                    <section class="medium-margin medium-padding thin-border flex-grow-1">
                        <label>Inapplicable If</label>
                        <ul class="indented no-list-style">
                            <li class="medium-padding" v-for="state in parentStatesExceptInherent" :key="state.id">
                                <label>
                                <input type="checkbox" @change="setInapplicableState(state, $event.target.checked)" :checked="selectedCharacter.inapplicableStates.find(s => s.id === state.id)" />
                                {{ state.name }}
                                </label>
                            </li>
                        </ul>
                    </section>
                </div>
            </collapsible-panel>
        </section>
        <section v-if="typeof selectedCharacter !== 'undefined'" class="scroll relative horizontal-flexbox">
            <collapsible-panel label="States">
                <div class="scroll medium-padding white-background">
                    <ul class="no-list-style medium-padding medium-margin grid-3">
                        <li v-for="state in selectedCharacter.states || []" :key="state.id" class="display-contents">
                            <label class="blue-hover medium-padding rounded nowrap horizontal-flexbox">
                                <input type="radio" v-model="selectedState" :value="state.id" name="selected-state">
                                <div class="form-grid">
                                    <div>FR</div><input type="text" class="flex-grow-1" v-model="state.name" />
                                    <div>EN</div><input type="text" class="flex-grow-1" v-model="state.nameEN" />
                                    <div>CN</div><input type="text" class="flex-grow-1" v-model="state.nameCN" />
                                </div>
                            </label>
                            <div v-if="state.photos.length === 0">&nbsp;</div>
                            <div v-if="state.photos.length > 0">
                                <img :src="state.photos[0].url" class="small-max-height">
                            </div>
                            <div class="close" @click="removeState(state)"></div>
                        </li>
                        <li>
                            <add-item v-on:add-item="addState"></add-item>
                        </li>
                    </ul>
                </div>
            </collapsible-panel>
            <div v-if="selectedCharacterState" class="stick-to-top thin-border medium-padding medium-margin white-background">
                <picture-box
                        class="scroll"
                        editable="true"
                        @add-photo="addStatePhoto"
                        @set-photo="setStatePhoto"
                        @delete-photo="deleteStatePhoto"
                        @open-photo="openStatePhoto">
                    <picture-frame v-for="(photo, index) in selectedCharacterState.photos" :key="photo.id"      
                        :pictureid="photo.id" :url="photo.url" :label="photo.label" :index="index" :editable="true">
                    </picture-frame>
                </picture-box>
                <div class="form-grid">
                    <label>Color</label>
                    <input type="color" v-model="selectedCharacterState.color">
                    <label>Description</label>
                    <textarea v-model="selectedCharacterState.description" class="input-text"></textarea>
                </div>
            </div>
        </section>
    </div>
</template>
<script lang="ts">
import TreeMenu from "./TreeMenu.vue";
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { createCharacter, createDetailData, Character, Hierarchy, Picture, State } from "../bunga"; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "CharactersTab",
    components: { TreeMenu },
    computed: {
        selectedCharacter(): Character|undefined {
            return this.charactersHierarchy?.itemWithId(this.selectedCharacterId);
        },
        selectedCharacterState(): State|undefined {
            return this.selectedCharacter?.states?.find(s => s.id === this.selectedState);
        },
        parentStates(): State[] {
            const parentId = this.selectedCharacter?.parentId;
            if (typeof parentId === "undefined")
                return[];
            const parent = this.charactersHierarchy?.itemWithId(parentId);
            if (typeof parent === "undefined")
                return[];
            return parent.states;
        },
        parentStatesExceptInherent(): State[] {
            return this.parentStates.filter(s => s.id !== this.selectedCharacter?.inherentState?.id);
        },
    },
    data() {
        return {
            selectedState: "",
            showLeftMenu: true,
        };
    },
    props: {
        charactersHierarchy: Object as PropType<Hierarchy<Character>>,
        selectedCharacterId: String,
    },
    methods: {
        setInapplicableState(state: State, selected: boolean) {
            this.$store.commit("setInapplicableState", { state, selected });
        },
        setRequiredState(state: State, selected: boolean) {
            this.$store.commit("setRequiredState", { state, selected });
        },
        setInherentState(state: State) {
            this.$store.commit("setInherentState", { state });
        },
        selectCharacter(id: string) {
            this.$emit("character-selected", id);
        },
        addCharacterPhoto(e: {detail: {value: string}}) {
            const numberOfPhotos = this.selectedCharacter!.photos.length;
            this.$store.commit("addCharacterPicture", {
                character: this.selectedCharacter,
                picture: {
                    id: `${this.selectedCharacter!.id}-${numberOfPhotos}`,
                    url: e.detail.value,
                    label: `${this.selectedCharacter!.name} #${numberOfPhotos}`,
                }
            });
        },
        setCharacterPhoto(e: {detail: {index: number, value: string}}) {
            this.$store.commit("setCharacterPicture", {
                character: this.selectedCharacter,
                index: e.detail.index,
                picture: { ...this.selectedCharacter?.photos[e.detail.index], url: e.detail.value }
            });
        },
        deleteCharacterPhoto(e: {detail: {index: number}}) {
            this.$store.commit("removeCharacterPicture", { character: this.selectedCharacter, index: e.detail.index });
        },
        addStatePhoto(e: {detail: {value: string}}) {
            const numberOfPhotos = this.selectedCharacterState!.photos.length;
            this.$store.commit("addStatePicture", {
                state: this.selectedCharacterState,
                picture: {
                    id: `${this.selectedCharacterState!.id}-${numberOfPhotos}`,
                    url: e.detail.value,
                    label: e.detail.value,
                }
            });
        },
        setStatePhoto(e: {detail: {index: number, value: string}}) {
            if (this.selectedCharacterState) {
                this.$store.commit("setStatePicture", {
                    state: this.selectedCharacterState,
                    index: e.detail.index,
                    picture: { ...this.selectedCharacterState.photos[e.detail.index], url: e.detail.value },
                });
            }
        },
        deleteStatePhoto(e: {detail: {index: number}}) {
            this.$store.commit("removeStatePicture", { state: this.selectedCharacterState, index: e.detail.index });
        },
        addCharacter(e: { value: string, parentId: string }) {
            this.$store.commit("addCharacter", createCharacter({
                ...createDetailData({ id: "", name: e.value }),
                parentId: e.parentId,
                childrenIds: [],
                states: [],
            }));
        },
        deleteCharacter(e: { itemId: string}) {
            const characterToDelete = this.charactersHierarchy?.itemWithId(e.itemId);
            if (typeof characterToDelete !== "undefined") {
                this.$store.commit("removeCharacter", characterToDelete);
            } else {
                console.warn(`Trying to delete character with id ${e.itemId} which doesn't exist.`, this.charactersHierarchy);
            }
        },
        addState(e: {detail: string}) {
            if (typeof this.selectedCharacter === "undefined") throw "addState failed: description is undefined.";

            this.$store.commit("addState", {
                character: this.selectedCharacter,
                state: {
                    id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                    descriptorId: this.selectedCharacter.id,
                    name: e.detail,
                    nameEN: "",
                    nameCN: "",
                    photos: []
                }
            });
        },
        removeState(state: State) {
            this.$store.commit("removeState", { state, character: this.selectedCharacter });
        },
        openDescriptionPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.selectedCharacter!.photos});
        },
        openStatePhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.$emit("open-photo", {index: e.detail.index, photos: this.selectedCharacterState?.photos});
        },
    }
});
</script>