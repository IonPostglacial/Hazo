<template>
    <Split class="start-align flex-grow-1 scroll">
        <SplitArea :size="33">
            <tree-menu v-if="showLeftMenu" class="scroll white-background no-print" editable :items="charactersHierarchy" name="description"
                :name-fields="[{ label: 'Name', propertyName: 'S'}, { label: '中文名', propertyName: 'CN' }]"
                @select-item="selectCharacter" :selected-item="selectedCharacter ? selectedCharacter.id : ''"
                @add-item="addCharacter"
                @move-item-up="moveUp" @move-item-down="moveDown"
                @unselected="selectedCharacterId = ''" @delete-item="deleteCharacter" v-slot="menuProps">
                <router-link class="flex-grow-1 nowrap unstyled-anchor" :to="'/characters/' + menuProps.item.id">{{ menuProps.item.name }}</router-link>
            </tree-menu>
        </SplitArea>
        <SplitArea :size="33" class="flex-grow-1">
            <div class="scroll flex-grow-1">
                <popup-galery v-if="!printMode" :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></popup-galery>
                <section class="scroll vertical-flexbox flex-grow-1">
                    <div class="horizontal-flexbox stick-to-top medium-padding thin-border background-gradient-1 no-print">
                        <button type="button" @click="showLeftMenu = !showLeftMenu">Left Menu</button>
                        <button type="button" @click="sortCharacters">Sort</button>
                        <button type="button" @click="printPresentation" :class="{'background-color-1': printMode}">Print</button>
                        <div class="button-group">
                            <button v-if="(typeof selectedCharacter !== 'undefined')" type="button" @click="copyItem">Copy</button>
                            <button type="button" @click="pasteItem">Paste</button>
                            <button v-if="(typeof selectedCharacter !== 'undefined')" type="button" @click="copyStates">Copy States</button>
                            <button type="button" @click="pasteStates">Paste States</button>
                        </div>
                    </div>
                    <div v-if="(typeof selectedCharacter !== 'undefined' && printMode)" class="white-background">
                        <characters-presentation
                            :dataset="dataset"
                            :character="selectedCharacter">
                        </characters-presentation>
                    </div>
                    <picture-box v-if="!printMode && (typeof selectedCharacter !== 'undefined')" editable="editable"
                        @add-photo="addCharacterPhoto"
                        @set-photo="setCharacterPhoto"
                        @delete-photo="deleteCharacterPhoto"
                        @open-photo="openDescriptionPhoto"
                        :pictures="selectedCharacter.pictures">
                    </picture-box>
                    <collapsible-panel v-if="!printMode && (typeof selectedCharacter !== 'undefined')" label="Identification">
                        <table>
                            <tr>
                                <th></th>
                                <th>S</th>
                                <th>EN</th>
                                <th>CN</th>
                            </tr>
                            <tr>
                                <th>Name</th>
                                <td><input class="flex-grow-1" type="text" v-model="selectedCharacter.name.S" /></td>
                                <td><input class="flex-grow-1" type="text" v-model="selectedCharacter.name.EN" /></td>
                                <td><input class="flex-grow-1" type="text" v-model="selectedCharacter.name.CN" /></td>
                            </tr>
                        </table>
                        <label class="item-property">Detail</label>
                        <textarea class="input-text" v-model="selectedCharacter.detail"></textarea>
                        <div>
                            <label class="item-property">Type</label>
                            <label><input type="radio" name="character-type" value="discrete" v-model="selectedCharacter.characterType">Discrete</label>
                            <label><input type="radio" name="character-type" value="range" v-model="selectedCharacter.characterType">Range</label>
                        </div>
                        <div v-if="selectedCharacter.characterType === 'discrete'">
                            <label class="item-property">Preset</label>
                            <label><input type="radio" name="character-type" value="" v-model="selectedCharacter.preset">None</label>
                            <label><input type="radio" name="character-type" value="flowering" v-model="selectedCharacter.preset">Flowering</label>
                            <label><input type="radio" name="character-type" value="family" v-model="selectedCharacter.preset">Family</label>
                        </div>
                    </collapsible-panel>
                    <characters-tree v-if="!printMode && selectedCharacter && selectedCharacter.characterType === 'discrete' && !selectedCharacter.preset" class="flex-grow-1 limited-width" :selected-character="selectedCharacter">
                    </characters-tree>
                    <div v-if="!printMode && isFloweringCharacter" class="centered-text medium-margin thin-border medium-padding white-background">
                        <flowering>
                        </flowering>
                    </div>
                    <collapsible-panel v-if="selectedCharacter && selectedCharacter.characterType === 'range'" label="Range">
                        <div class="form-grid medium-padding">
                            <label for="range-min">From</label><input name="range-min" type="number" v-model="selectedCharacter.min" />
                            <label for="range-max">To</label><input name="range-max" type="number" v-model="selectedCharacter.max" />
                        </div>
                    </collapsible-panel>
                    <collapsible-panel v-if="!printMode && selectedCharacter && selectedCharacter.parentId" label="Dependencies">
                        <div class="horizontal-flexbox">
                            <section v-if="isDiscreteCharacter" class="medium-margin medium-padding thin-border flex-grow-1">
                                <label>Inherent State</label>
                                <ul class="indented no-list-style">
                                    <li class="medium-padding" v-for="state in parentStates" :key="state.id">
                                        <label>
                                            <input type="radio" :checked="isInherentState(state)" name="inherent-state" @change="setInherentState(state)" />
                                            {{ state.name.S }}
                                        </label>
                                    </li>
                                </ul>
                            </section>
                            <section class="medium-margin medium-padding thin-border flex-grow-1">
                                <label>Only Applicable If</label>
                                <ul class="indented no-list-style">
                                    <li class="medium-padding" v-for="state in parentStatesExceptInherent" :key="state.id">
                                        <label>
                                            <input type="checkbox" @change="setRequiredState(state, $event.target.checked)" :checked="selectedCharacter ? selectedCharacter.requiredStates.find(s => s.id === state.id) : false" />
                                            {{ state.name.S }}
                                        </label>
                                    </li>
                                </ul>
                            </section>
                            <section class="medium-margin medium-padding thin-border flex-grow-1">
                                <label>Inapplicable If</label>
                                <ul class="indented no-list-style">
                                    <li class="medium-padding" v-for="state in parentStatesExceptInherent" :key="state.id">
                                        <label>
                                        <input type="checkbox" @change="setInapplicableState(state, $event.target.checked)" :checked="selectedCharacter ? selectedCharacter.inapplicableStates.find(s => s.id === state.id) : false" />
                                        {{ state.name.S }}
                                        </label>
                                    </li>
                                </ul>
                            </section>
                        </div>
                    </collapsible-panel>
                </section>
            </div>
        </SplitArea>
        <SplitArea :size="33">
            <section v-if="!printMode && selectedCharacter && selectedCharacter.characterType === 'discrete' && !selectedCharacter.preset" class="scroll relative horizontal-flexbox">
                <collapsible-panel label="States">
                    <div class="scroll medium-padding white-background">
                        <label v-if="maybeInherentState">
                            <input type="checkbox"
                                @input="onlyAllowState(maybeInherentState)"
                                :checked="stateInAllowList(maybeInherentState)">
                            Add to allow list
                        </label>
                        <label v-if="maybeInherentState">
                            <input type="checkbox"
                                @input="denyState(maybeInherentState)"
                                :checked="stateInDenyList(maybeInherentState)">
                            Add to deny list
                        </label>
                        <button class="background-color-1" @click="exportStates">Copy</button>
                        <ul class="no-list-style medium-padding medium-margin">
                            <li v-for="state in statesToDisplay" :key="state.id" class="horizontal-flexbox">
                                <div class="vertical-flexbox thin-border">
                                    <div @click="moveStateUp(state)" class="move-up">🡡</div>
                                    <div @click="moveStateDown(state)" class="move-down">🡣</div>
                                    <label for="allow">
                                        A<input name="allow" type="checkbox" @input="onlyAllowState(state)" :checked="stateInAllowList(state)">
                                    </label>
                                    <label for="deny">
                                        D<input name="deny" type="checkbox" @input="denyState(state)" :checked="stateInDenyList(state)">
                                    </label>
                                </div>
                                <label class="medium-padding rounded nowrap horizontal-flexbox">
                                    <div class="form-grid">
                                        <div>FR</div><input type="text" class="flex-grow-1" v-model="state.name.S" />
                                        <div>EN</div><input type="text" class="flex-grow-1" v-model="state.name.EN" />
                                        <div>CN</div><input type="text" class="flex-grow-1" v-model="state.name.CN" />
                                        <label>Color</label><input type="color" v-model="state.color">
                                        <div>Description</div>
                                        <textarea v-model="state.description" class="input-text" pleceholder="description"></textarea>
                                    </div>
                                    <picture-box
                                        class="scroll"
                                        :editable="true"
                                        @add-photo="addStatePhoto(state, $event)"
                                        @set-photo="setStatePhoto(state, $event)"
                                        @delete-photo="deleteStatePhoto(state, $event)"
                                        @open-photo="openStatePhoto(state, $event)"
                                        :pictures="state.pictures">
                                    </picture-box>
                                    <div class="close" @click="removeState(state)"></div>
                                </label>
                            </li>
                            <li>
                                <add-item @add-item="addState"></add-item>
                            </li>
                        </ul>
                    </div>
                </collapsible-panel>
            </section>
        </SplitArea>
    </Split>
</template>
<script lang="ts">
import AddItem from "./AddItem.vue";
import TreeMenu from "./TreeMenu.vue";
import CharactersTree from "./CharactersTree.vue";
import SplitPanel from "./SplitPanel.vue";
import CollapsiblePanel from "./CollapsiblePanel.vue";
import PopupGalery from "./PopupGalery.vue";
import CharactersPresentation from "./CharactersPresentation.vue";
import Flowering from "./Flowering.vue";
import PictureBox from "./PictureBox.vue";
import Vue from "vue";
import { Dataset, Character, Hierarchy, State } from "@/datatypes";
import { createCharacter } from "@/datatypes/Character";
import { normalizePicture } from "@/datatypes/picture";
import { sortHierarchy } from "@/datatypes/hierarchy";

export default Vue.extend({
    name: "CharactersTab",
    components: { AddItem, CollapsiblePanel, Flowering, PictureBox, PopupGalery, TreeMenu, CharactersTree, CharactersPresentation, SplitPanel },
    data() {
        return {
            store: Hazo.store,
            showLeftMenu: true,
            showBigImage: false,
            bigImages: [{id: "", url: "", label: ""}],
            selectedCharacterId: this.$route.params.id ?? "",
            printMode: false,
        };
    },
    watch: {
        $route(to: any) {
            this.selectedCharacterId = to.params.id;
        }
    },
    computed: {
        isDiscreteCharacter(): boolean {
            return this.selectedCharacter?.characterType === "discrete";
        },
        isFloweringCharacter(): boolean {
            const ch = this.selectedCharacter;
            return ch?.characterType === "discrete" && ch.preset === "flowering";
        },
        isRangeCharacter(): boolean {
            return this.selectedCharacter?.characterType === "range";
        },
        maybeInherentState(): State|undefined {
            const ch = this.selectedCharacter;
            return ch?.characterType === "range" ? undefined : ch?.inherentState;
        },
        dataset(): Dataset {
            return this.store.dataset;
        },
        charactersHierarchy(): Hierarchy<Character> {
            return this.store.dataset.charactersHierarchy;
        },
        selectedCharacter(): Character|undefined {
            return this.dataset.character(this.selectedCharacterId);
        },
        parentStates(): State[] {
            const parentId = this.selectedCharacter?.parentId;
            if (typeof parentId === "undefined")
                return[];
            const parent = this.dataset.character(parentId);
            if (typeof parent === "undefined")
                return[];
            return Array.from(this.dataset.characterStates(parent));
        },
        parentStatesExceptInherent(): State[] {
            const ch = this.selectedCharacter;
            return this.parentStates.filter(s => ch?.characterType === "range" || s.id !== ch?.inherentState?.id);
        },
        statesToDisplay(): Array<State> {
            const childrenInherentStateIds = this.selectedCharacter?.children
                .map(c => c.characterType === "range" ? undefined : c.inherentState?.id)
                .filter(s => typeof s !== "undefined") ?? [];
            return Array.from(this.dataset.characterStates(this.selectedCharacter)).
                filter(s => !childrenInherentStateIds.includes(s.id));
        },
    },
    methods: {
        sortCharacters() {
            sortHierarchy(this.charactersHierarchy, (c1, c2) => c1.name.S.localeCompare(c2.name.S));
        },
        isInherentState(state: State): boolean {
            const ch = this.selectedCharacter;
            return ch?.characterType === "discrete" && ch.inherentState ? ch.inherentState.id === state.id : false
        },
        stateInAllowList(state: State): boolean {
            return this.store.statesAllowList.some(s => s.id === state.id);
        },
        stateInDenyList(state: State): boolean {
            return this.store.statesDenyList.some(s => s.id === state.id);
        },
        onlyAllowState(state: State|undefined) {
            if (!state) return;
            if (this.stateInAllowList(state)) {
                this.store.do("removeStateFromAllowList", state);
            } else {
                this.store.do("addStateToAllowList", state);
            }
        },
        denyState(state: State|undefined) {
            if (!state) return;
            if (this.stateInDenyList(state)) {
                this.store.do("removeStateFromDenyList", state);
            } else {
                this.store.do("addStateToDenyList", state);
            }
        },
        exportStates() {
            if (this.selectedCharacter) {
                navigator.clipboard.writeText(this.statesToDisplay.map(s => `${s.name.S??""}\n${s.name.EN??""}\n${s.name.CN??""}\n`).join("\n"));
            } else {
                alert("No states");
            }
        },
        printPresentation() {
            this.printMode = !this.printMode;
            if (this.printMode) {
                window.setTimeout(() => window.print(), 500);
            }
        },
        copyItem() {
            if (this.selectedCharacter) {
                this.store.do("copyCharacter", this.selectedCharacter);
            }
        },
        pasteItem() {
            this.store.do("pasteCharacter", this.selectedCharacterId);
        },
        copyStates() {
            this.store.do("copyStates", Array.from(this.dataset.characterStates(this.selectedCharacter)));
        },
        pasteStates() {
            this.store.do("pasteStates", this.selectedCharacterId);
        },
        moveUp(item: Character) {
            if (this.selectedCharacter) this.store.do("moveCharacterUp", item);
        },
        moveDown(item: Character) {
            if (this.selectedCharacter) this.store.do("moveCharacterDown", item);
        },
        setInapplicableState(state: State, selected: boolean) {
            this.store.do("setInapplicableState", { character: this.selectedCharacter!, state, selected });
        },
        setRequiredState(state: State, selected: boolean) {
            this.store.do("setRequiredState", { character: this.selectedCharacter!, state, selected });
        },
        setInherentState(state: State) {
            this.store.do("setInherentState", { character: this.selectedCharacter!, state });
        },
        selectCharacter(id: string) {
            this.selectedCharacterId = id;
        },
        addCharacterPhoto(e: {detail: {value: string[]}}) {
            if (!this.selectedCharacter) { return; }

            const [url, label] = e.detail.value;
            const numberOfPhotos = this.selectedCharacter!.pictures.length;
            this.store.do("addCharacterPicture", {
                character: this.selectedCharacter,
                picture: normalizePicture({
                    id: `${this.selectedCharacter!.id}-${numberOfPhotos}`,
                    url: url,
                    label: label ?? `${this.selectedCharacter!.name} #${numberOfPhotos}`,
                    hubUrl: undefined,
                })
            });
        },
        setCharacterPhoto(e: {detail: {index: number, src: string, hubUrl: string}}) {
            if (!this.selectedCharacter) { return; }

            this.store.do("setCharacterPicture", {
                character: this.selectedCharacter,
                index: e.detail.index,
                picture: normalizePicture({ ...this.selectedCharacter.pictures[e.detail.index], url: e.detail.src, hubUrl: e.detail.hubUrl })
            });
        },
        deleteCharacterPhoto(e: {detail: {index: number}}) {
            if (!this.selectedCharacter) { return; }

            this.store.do("removeCharacterPicture", { character: this.selectedCharacter, index: e.detail.index });
        },
        addStatePhoto(state: State, e: {detail: {value: string}}) {
            const numberOfPhotos = state.pictures.length;
            this.store.do("addStatePicture", {
                character: this.selectedCharacter,
                state: state,
                picture: normalizePicture({
                    id: `${state.id}-${numberOfPhotos}`,
                    url: e.detail.value,
                    label: e.detail.value,
                    hubUrl: undefined,
                })
            });
        },
        setStatePhoto(state: State, e: {detail: {index: number, src: string, hubUrl: string}}) {
            if (state) {
                this.store.do("setStatePicture", {
                    character: this.selectedCharacter,
                    state: state,
                    index: e.detail.index,
                    picture: normalizePicture({ ...state.pictures[e.detail.index], url: e.detail.src, hubUrl: e.detail.hubUrl }),
                });
            }
        },
        deleteStatePhoto(state: State, e: {detail: {index: number}}) {
            this.store.do("removeStatePicture", { character: this.selectedCharacter, state: state, index: e.detail.index });
        },
        openStatePhoto(state: State, e: Event & {detail: { index: number }}) {
            this.showBigImage = true;
            this.bigImages = state.pictures;
        },
        addCharacter(e: { value: string[], parentId: string }) {
            const [name, nameCN] = e.value;
            this.store.do("addCharacter", createCharacter({
                presetStates: this.dataset.presetStates,
                name: { S: name, FR: name, CN: nameCN }, 
                parentId: e.parentId,
            }));
        },
        deleteCharacter(e: { itemId: string}) {
            const characterToDelete = this.dataset.character(e.itemId);
            if (typeof characterToDelete !== "undefined") {
                this.store.do("removeCharacter", characterToDelete);
            } else {
                console.warn(`Trying to delete character with id ${e.itemId} which doesn't exist.`, this.charactersHierarchy);
            }
        },
        addState(e: {detail: string[]}) {
            if (typeof this.selectedCharacter === "undefined") throw "addState failed: description is undefined.";
            const [name, nameEN, nameCN, color, description] = e.detail;
            this.store.do("addState", {
                state: {
                    id: "",
                    name: { S: name, FR: name, EN: nameEN, CN: nameCN },
                    color,
                    description,
                    pictures: []
                },
                character: this.selectedCharacter,
            });
        },
        moveStateUp(state: State) {
            if (typeof this.selectedCharacter === "undefined") return;
            this.store.do("moveStateUp", { character: this.selectedCharacter, state });
        },
        moveStateDown(state: State) {
            if (typeof this.selectedCharacter === "undefined") return;
            this.store.do("moveStateDown", { character: this.selectedCharacter, state });
        },
        removeState(state: State) {
            this.store.do("removeState", { character: this.selectedCharacter!, state });
        },
        openDescriptionPhoto(e: Event & {detail: { index: number }}) {
            this.showBigImage = true;
            this.bigImages = this.selectedCharacter!.pictures;
        },
    }
});
</script>