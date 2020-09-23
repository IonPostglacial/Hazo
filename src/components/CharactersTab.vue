<template>
    <div class="horizontal-flexbox start-align flex-grow-1 scroll">
        <nav v-if="showLeftMenu" class="scroll medium-margin thin-border white-background">
            <TreeMenu editable :items="charactersHierarchy" name="description"
                :name-fields="[{ label: 'Name', propertyName: 'name'}, { label: '中文名', propertyName: 'nameCN'}]"
                @select-item="selectCharacter" :selected-item="selectedCharacterId"
                @add-item="addCharacter"
                @delete-item="deleteCharacter">
            </TreeMenu>
        </nav>
        <section v-if="typeof selectedCharacter !== 'undefined'" class="vertical-flexbox flex-grow-1">
            <picture-box editable="true"
                    @add-photo="addCharacterPhoto"
                    @set-photo="setCharacterPhoto"
                    @delete-photo="deleteCharacterPhoto"
                    @open-photo="openDescriptionPhoto">
                <picture-frame v-for="(photo, index) in selectedCharacter.photos" :key="index"
                    :url="photo" :index="index" editable="true"></picture-frame>
            </picture-box>
            <ul class="thin-border medium-margin medium-padding white-background flex-grow-1 scroll">
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name FR</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.name" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name EN</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.nameEN" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name CN</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.nameCN" /></div>

                <label class="item-property">Detail</label>
                <textarea v-model="selectedCharacter.detail"></textarea><br/>

                <div v-if="selectedCharacter.parentId">
                    <label>Inapplicable If</label>
                    <ul class="indented">
                        <li class="medium-padding" v-for="state in charactersHierarchy.getItemById(selectedCharacter.parentId).states" :key="state.id">
                            <label>
                            <input type="checkbox" v-on:change="setInapplicableState(state, $event.target.checked)" :checked="selectedCharacter.inapplicableStates.find(s => s.id === state.id)" />
                            {{ state.name }}
                            </label>
                        </li>
                    </ul>
                </div>
            </ul>
        </section>
        <section v-if="typeof selectedCharacter !== 'undefined'" class="scroll">
            <div class="relative" style="height: 98%">
                <picture-box v-if="selectedCharacterState"
                        class="scroll"
                        editable="true"
                        @add-photo="addStatePhoto"
                        @set-photo="setStatePhoto"
                        @delete-photo="deleteStatePhoto"
                        @open-photo="openStatePhoto">
                    <picture-frame v-for="(photo, index) in selectedCharacterState.photos" :key="index"      
                        :url="photo" :index="index" :editable="true"></picture-frame>
                </picture-box>
                <collapsible-panel label="States">
                    <div class="scroll thin-border medium-margin medium-padding white-background">
                        <ul class="no-list-style medium-padding medium-margin">
                            <li class="medium-padding" v-for="state in selectedCharacter.states || []" :key="state.id">
                                <label class="blue-hover medium-padding nowrap">
                                    <input type="radio" v-model="selectedState" :value="state.id" name="selected-state">
                                    <input type="text" v-model="state.name" />
                                </label>
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
import { Character, Hierarchy, State } from "../bunga"; // eslint-disable-line no-unused-vars
import { createDetailData } from '@/bunga/DetailData';
import { createHierarchicalItem } from '@/bunga/HierarchicalItem';

export default Vue.extend({
    name: "CharactersTab",
    components: { TreeMenu },
    computed: {
        selectedCharacter(): Character|undefined {
            return this.charactersHierarchy.getItemById(this.selectedCharacterId);
        },
        selectedCharacterState(): State|undefined {
            return this.selectedCharacter?.states?.find(s => s.id === this.selectedState);
        },
    },
    data() {
        return {
            charactersHierarchy: this.initCharacters,
            selectedCharacterId: "",
            selectedState: "",
        };
    },
    props: {
        showLeftMenu: Boolean,
        initCharacters: Hierarchy as PropType<Hierarchy<Character>>,
    },
    methods: {
        setInapplicableState(state: State, selected: boolean) {
            if (selected) {
                this.selectedCharacter!.inapplicableStates.push(state);
            } else {
                const i = this.selectedCharacter!.inapplicableStates.findIndex(s => s.id === state.id);
                this.selectedCharacter!.inapplicableStates.splice(i, 1);
            }
        },
        selectCharacter(id: string) {
            console.log(this.charactersHierarchy.getItemById(id));
            this.selectedCharacterId = id;
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
            const newDescription = this.charactersHierarchy.setItem({
                ...createHierarchicalItem<Character>({
                    ...createDetailData({ id: "", name: value }),
                    type: "character",
                    parentId: parentId,
                    childrenIds: [],
                }),
                states: [],
                inapplicableStates: []
            });
            const parentDescription = this.charactersHierarchy.getItemById(parentId);
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
            this.$emit("change-characters", this.charactersHierarchy);
        },
        deleteCharacter({ itemId }: { itemId: string}) {
            const descriptionToDelete = this.charactersHierarchy.getItemById(itemId);
            if (typeof descriptionToDelete !== "undefined") {
                this.charactersHierarchy.removeItem(descriptionToDelete);
            } else {
                console.warn(`Trying to delete item with id ${itemId} which doesn't exist.`, this.charactersHierarchy);
            }
        },
        addState({detail} : {detail: string}) {
            if (typeof this.selectedCharacter === "undefined") throw "addState failed: description is undefined.";
            this.selectedCharacter.states.push({
                id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                descriptorId: this.selectedCharacter.id,
                name: detail,
                photos: []
            });
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