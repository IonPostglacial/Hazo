<template>
    <div class="horizontal-flexbox start-align flex-grow-1 scroll">
        <nav v-if="showLeftMenu" class="scroll thin-border white-background">
            <TreeMenu editable :items="charactersHierarchy" name="description"
                :name-fields="[{ label: 'Name', propertyName: 'name'}, { label: '中文名', propertyName: 'nameCN' }]"
                @select-item="selectCharacter" :selected-item="selectedCharacter ? selectedCharacter.id : ''"
                @add-item="addCharacter"
                @unselected="selectedCharacterId = undefined" @delete-item="deleteCharacter" v-slot="menuProps">
                <router-link class="flex-grow-1 nowrap unstyled-anchor" :to="'/characters/' + menuProps.item.id">{{ menuProps.item.name }}</router-link>
            </TreeMenu>
        </nav>
        <popup-galery :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></popup-galery>
        <section class="scroll vertical-flexbox flex-grow-1">
            <div class="horizontal-flexbox medium-padding thin-border">
                <button type="button" @click="showLeftMenu = !showLeftMenu">Left Menu</button>
                <div class="flex-grow-1 medium-padding">{{ selectedCharacter ? selectedCharacter.name : '' }}</div>
                <div class="button-group">
                    <button v-if="typeof selectedCharacter !== 'undefined'" type="button" @click="copyItem">Copy</button>
                    <button type="button" @click="pasteItem">Paste</button>
                    <button v-if="typeof selectedCharacter !== 'undefined'" type="button" @click="copyStates">Copy States</button>
                    <button type="button" @click="pasteStates">Paste States</button>
                </div>
            </div>
            <picture-box v-if="typeof selectedCharacter !== 'undefined'" editable="editable"
                    @add-photo="addCharacterPhoto"
                    @set-photo="setCharacterPhoto"
                    @delete-photo="deleteCharacterPhoto"
                    @open-photo="openDescriptionPhoto">
                <picture-frame v-for="(photo, index) in selectedCharacter.photos" :key="photo.id"
                    :pictureid="photo.id" :url="photo.url" :label="photo.label" :index="index" editable="true"></picture-frame>
            </picture-box>
            <collapsible-panel v-if="typeof selectedCharacter !== 'undefined'" label="Identification">
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name FR</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.name" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name EN</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.nameEN" /></div>
                <div class="horizontal-flexbox center-items"><label class="medium-margin-horizontal">Name CN</label><input class="flex-grow-1" type="text" v-model="selectedCharacter.nameCN" /></div>
                <label class="item-property">Detail</label>
                <textarea class="input-text" v-model="selectedCharacter.detail"></textarea> 
            </collapsible-panel>
            <collapsible-panel v-if="selectedCharacter && selectedCharacter.parentId" label="Dependencies">
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
                    <ul class="no-list-style medium-padding medium-margin">
                        <li v-for="state in selectedCharacter.states || []" :key="state.id" class="display-contents">
                            <label class="medium-padding rounded nowrap horizontal-flexbox">
                                <div class="form-grid">
                                    <div>FR</div><input type="text" class="flex-grow-1" v-model="state.name" />
                                    <div>EN</div><input type="text" class="flex-grow-1" v-model="state.nameEN" />
                                    <div>CN</div><input type="text" class="flex-grow-1" v-model="state.nameCN" />
                                    <label>Color</label><input type="color" v-model="state.color">
                                    <div>Description</div>
                                    <textarea v-model="state.description" class="input-text" pleceholder="description"></textarea>
                                </div>
                                <picture-box
                                        class="scroll"
                                        editable="true"
                                        @add-photo="addStatePhoto(state, $event)"
                                        @set-photo="setStatePhoto(state, $event)"
                                        @delete-photo="deleteStatePhoto(state, $event)"
                                        @open-photo="openStatePhoto(state, $event)">
                                    <picture-frame v-for="(photo, index) in state.photos" :key="photo.id"      
                                        :pictureid="photo.id" :url="photo.url" :label="photo.label" :index="index" :editable="true">
                                    </picture-frame>
                                </picture-box>
                                <div class="close" @click="removeState(state)"></div>
                            </label>
                        </li>
                        <li>
                            <add-item v-on:add-item="addState"></add-item>
                        </li>
                    </ul>
                </div>
            </collapsible-panel>
        </section>
    </div>
</template>
<script lang="ts">
import TreeMenu from "./TreeMenu.vue";
import PopupGalery from "./PopupGalery.vue";
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { createCharacter, createDetailData, Character, HierarchicalItem, Hierarchy, Picture, State } from "../bunga"; // eslint-disable-line no-unused-vars

export default Vue.extend({
    name: "CharactersTab",
    components: { PopupGalery, TreeMenu },
    data() {
        return {
            showLeftMenu: true,
            showBigImage: false,
            bigImages: [{id: "", url: "", label: ""}],
            selectedCharacterId: this.$route.params.id ?? "",
        };
    },
    watch: {
        $route(to: any) {
            this.selectedCharacterId = to.params.id;
        }
    },
    computed: {
        charactersHierarchy() {
            return this.$store.state.dataset.charactersHierarchy;
        },
        selectedCharacter(): Character|undefined {
            return this.charactersHierarchy?.itemWithId(this.selectedCharacterId);
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
    methods: {
        copyItem() {
            this.$store.commit("copyCharacter", this.selectedCharacter);
        },
        pasteItem() {
            this.$store.commit("pasteCharacter", this.selectedCharacterId);
        },
        copyStates() {
            this.$store.commit("copyStates", this.selectedCharacter?.states);
        },
        pasteStates() {
            this.$store.commit("pasteStates", this.selectedCharacterId);
        },
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
            this.selectedCharacterId = id;
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
        addStatePhoto(state: State, e: {detail: {value: string}}) {
            const numberOfPhotos = state.photos.length;
            this.$store.commit("addStatePicture", {
                state: state,
                picture: {
                    id: `${state.id}-${numberOfPhotos}`,
                    url: e.detail.value,
                    label: e.detail.value,
                }
            });
        },
        setStatePhoto(state: State, e: {detail: {index: number, value: string}}) {
            if (state) {
                this.$store.commit("setStatePicture", {
                    state: state,
                    index: e.detail.index,
                    picture: { ...state.photos[e.detail.index], url: e.detail.value },
                });
            }
        },
        deleteStatePhoto(state: State, e: {detail: {index: number}}) {
            this.$store.commit("removeStatePicture", { state: state, index: e.detail.index });
        },
        openStatePhoto(state: State, e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.showBigImage = true;
            this.bigImages = state.photos;
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
                id: "s" + ((Math.random() * 1000) | 0) + Date.now().toString(),
                descriptorId: this.selectedCharacter.id,
                name: e.detail,
                nameEN: "",
                nameCN: "",
                photos: []
            });
        },
        removeState(state: State) {
            this.$store.commit("removeState", state);
        },
        openDescriptionPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.showBigImage = true;
            this.bigImages = this.selectedCharacter!.photos;
        },
    }
});
</script>