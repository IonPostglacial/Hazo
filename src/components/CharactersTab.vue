<template>
    <div class="horizontal-flexbox start-align flex-grow-1 scroll">
        <nav v-if="showLeftMenu" class="scroll thin-border white-background">
            <TreeMenu editable :items="charactersHierarchy" name="description"
                :name-fields="[{ label: 'Name', propertyName: 'name'}, { label: '中文名', propertyName: 'nameCN'}]"
                @select-item="selectCharacter" :selected-item="selectedCharacter ? selectedCharacter.id : ''"
                @add-item="addCharacter"
                @delete-item="deleteCharacter">
            </TreeMenu>
        </nav>
        <section v-if="typeof selectedCharacter !== 'undefined'" class="scroll vertical-flexbox flex-grow-1">
            <picture-box editable="true"
                    @add-photo="addCharacterPhoto"
                    @set-photo="setCharacterPhoto"
                    @delete-photo="deleteCharacterPhoto"
                    @open-photo="openDescriptionPhoto">
                <picture-frame v-for="(photo, index) in selectedCharacter.photos" :key="index"
                    :url="photo" :index="index" editable="true"></picture-frame>
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
        <section v-if="typeof selectedCharacter !== 'undefined'" class="scroll">
            <div class="relative vertical-flexbox">
                <div v-if="selectedCharacterState" class="stick-to-top medium-padding medium-margin white-background">
                    <picture-box
                            class="scroll"
                            editable="true"
                            @add-photo="addStatePhoto"
                            @set-photo="setStatePhoto"
                            @delete-photo="deleteStatePhoto"
                            @open-photo="openStatePhoto">
                        <picture-frame v-for="(photo, index) in selectedCharacterState.photos" :key="index"      
                            :url="photo" :index="index" :editable="true"></picture-frame>
                    </picture-box>
                    <collapsible-panel label="Description">
                        <label>
                            <textarea v-model="selectedCharacterState.description" class="input-text"></textarea>
                        </label>
                    </collapsible-panel>
                </div>
                <collapsible-panel label="States">
                    <div class="scroll thin-border medium-margin medium-padding white-background">
                        <ul class="no-list-style medium-padding medium-margin">
                            <li v-for="state in selectedCharacter.states || []" :key="state.id" class="horizontal-flexbox flex-centered">
                                <label class="blue-hover medium-padding rounded nowrap horizontal-flexbox flex-centered">
                                    <input type="radio" v-model="selectedState" :value="state.id" name="selected-state">
                                    <input type="text" class="flex-grow-1" v-model="state.name" />
                                </label>
                                <div class="close" @click="removeState(state)"></div>
                            </li>
                            <li>
                                <add-item v-on:add-item="addState"></add-item>
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
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { createCharacter, createDetailData, Character, Hierarchy, State } from "../bunga"; // eslint-disable-line no-unused-vars
import clone from '@/clone';

export default Vue.extend({
    name: "CharactersTab",
    components: { TreeMenu },
    computed: {
        selectedCharacterState(): State|undefined {
            return this.selectedCharacter?.states?.find(s => s.id === this.selectedState);
        },
        parentStates(): State[] {
            const parentId = this.selectedCharacter?.parentId;
            if (typeof parentId === "undefined")
                return[];
            const parent = this.charactersHierarchy.itemWithId(parentId);
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
            charactersHierarchy: this.initCharacters,
            selectedState: "",
        };
    },
    props: {
        showLeftMenu: Boolean,
        initCharacters: Hierarchy as PropType<Hierarchy<Character>>,
        selectedCharacter: Object as PropType<Character|undefined>,
    },
    methods: {
        setInapplicableState(state: State, selected: boolean) {
            if (selected) {
                this.selectedCharacter!.inapplicableStates.push(state);
            } else {
                const i = this.selectedCharacter!.inapplicableStates.findIndex(s => s.id === state.id);
                this.selectedCharacter!.inapplicableStates.splice(i, 1);
            }
            this.charactersHierarchy.add(clone(this.selectedCharacter!));
        },
        setRequiredState(state: State, selected: boolean) {
            if (selected) {
                this.selectedCharacter!.requiredStates.push(state);
            } else {
                const i = this.selectedCharacter!.requiredStates.findIndex(s => s.id === state.id);
                this.selectedCharacter!.requiredStates.splice(i, 1);
            }
            this.charactersHierarchy.add(clone(this.selectedCharacter!));
        },
        setInherentState(state: State) {
            this.selectedCharacter!.inherentState = state;
            const requiredStateIndex = this.selectedCharacter!.requiredStates.findIndex(s => s.id === state.id);
            if (requiredStateIndex >= 0) {
                this.selectedCharacter!.requiredStates.splice(requiredStateIndex, 1);
            }
            const inapplicableStateIndex = this.selectedCharacter!.inapplicableStates.findIndex(s => s.id === state.id);
            if (inapplicableStateIndex >= 0) {
                this.selectedCharacter!.inapplicableStates.splice(inapplicableStateIndex, 1);
            }
            this.charactersHierarchy.add(clone(this.selectedCharacter!));
        },
        selectCharacter(id: string) {
            this.$emit("character-selected", id);
        },
        addCharacterPhoto(e: {detail: {value: string}}) {
            this.selectedCharacter!.photos.push(e.detail.value);
        },
        setCharacterPhoto(e: {detail: {index: number, value: string}}) {
            this.selectedCharacter!.photos[e.detail.index] = e.detail.value;
        },
        deleteCharacterPhoto(e: {detail: {index: number}}) {
            this.selectedCharacter!.photos.splice(e.detail.index, 1);
        },
        addStatePhoto(e: {detail: {value: string}}) {
            if (this.selectedCharacterState && typeof this.selectedCharacterState?.photos === "undefined") {
                this.selectedCharacterState.photos = [];
            }
            this.selectedCharacterState?.photos.push(e.detail.value);
        },
        setStatePhoto(e: {detail: {index: number, value: string}}) {
            if (this.selectedCharacterState) {
                this.selectedCharacterState.photos[e.detail.index] = e.detail.value;
            }
        },
        deleteStatePhoto(e: {detail: {index: number}}) {
            this.selectedCharacterState?.photos.splice(e.detail.index, 1);
        },
        addCharacter({ value, parentId }: { value: string, parentId: string }) {
            const newCharacter = this.charactersHierarchy.add(
                createCharacter({
                    ...createDetailData({ id: "", name: value }),
                    parentId: parentId,
                    childrenIds: [],
                    states: [],
                })
            );
            const parentDescription = this.charactersHierarchy.itemWithId(parentId);
            if(typeof parentDescription !== "undefined") {
                const newState = {
                    id: "s-auto-" + newCharacter.id,
                    descriptorId: parentId, name: newCharacter.name, photos: []
                };
                parentDescription.states = [...parentDescription.states, newState];
                newCharacter.inherentState = newState;
            }
            this.$emit("change-characters", this.charactersHierarchy);
        },
        deleteCharacter({ itemId }: { itemId: string}) {
            const descriptionToDelete = this.charactersHierarchy.itemWithId(itemId);
            if (typeof descriptionToDelete !== "undefined") {
                this.charactersHierarchy.remove(descriptionToDelete);
            } else {
                console.warn(`Trying to delete item with id ${itemId} which doesn't exist.`, this.charactersHierarchy);
            }
        },
        addState(e: {detail: string}) {
            if (typeof this.selectedCharacter === "undefined") throw "addState failed: description is undefined.";
            this.selectedCharacter.states.push({
                id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                descriptorId: this.selectedCharacter.id,
                name: e.detail,
                photos: []
            });
        },
        removeState(state: State) {
            this.$emit("remove-state", { state, character: this.selectedCharacter });
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