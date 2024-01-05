<template>
    <SplitPanel class="horizontal-flexbox start-align flex-grow-1 no-vertical-overflow">
        <TreeMenu v-if="showLeftMenu" class="scroll white-background no-print" editable :items="charactersHierarchy" name="description"
            :name-fields="nameFields"
            :name-store="nameStore"
            @closed="showLeftMenu = false"
            @select-item="selectCharacter" :selected-item="selectedCharacter ? selectedCharacter.id : ''"
            @add-item="addCharacterHandler"
            @move-item-up="moveUp" @move-item-down="moveDown"
            @unselected="unselectCharacter" @delete-item="removeCharacter" v-slot="menuProps">
            <RouterLink class="flex-grow-1 nowrap unstyled-anchor" :to="'/characters/' + menuProps.item.id">{{ menuProps.item.name }}</RouterLink>
        </TreeMenu>
        <VBox>
            <HBox class="stick-to-top medium-padding thin-border no-print">
                <button v-if="!showLeftMenu" @click="showLeftMenu = true">
                    <font-awesome-icon icon="fa-solid fa-arrow-right" />
                </button>
                <button type="button" @click="printPresentation" :class="{'background-color-1': printMode}">
                    <font-awesome-icon icon="fa-solid fa-print" />
                </button>
                <div class="button-group">
                    <button v-if="(typeof selectedCharacter !== 'undefined')" type="button" @click="copyItem">
                        <font-awesome-icon icon="fa-solid fa-copy" />
                    </button>
                    <button type="button" @click="pasteItem">
                        <font-awesome-icon icon="fa-solid fa-paste" />
                    </button>
                    <button v-if="(typeof selectedCharacter !== 'undefined')" type="button" @click="copyCurrentStates">Copy States</button>
                    <button type="button" @click="pasteCurrentStates">Paste States</button>
                </div>
            </HBox>
            <SplitPanel class="horizontal-flexbox start-align flex-grow-1 no-vertical-overflow">
                <VBox class="scroll flex-grow-1">
                    <ColumnHeader class="stick-to-top" label="Character" :hide-actions="true"></ColumnHeader>
                    <PopupGalery v-if="!printMode" :title="selectedCharacter?.name.S" :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></PopupGalery>
                    <VBox class="flex-grow-1">
                        <div v-if="(typeof selectedCharacter !== 'undefined' && printMode)" class="white-background">
                            <CharactersPresentation :character="selectedCharacter">
                            </CharactersPresentation>
                        </div>
                        <PictureBox v-if="!printMode && (typeof selectedCharacter !== 'undefined')" :editable="true"
                            @add-photo="addCharacterPhoto"
                            @set-photo="setCharacterPhoto"
                            @delete-photo="deleteCharacterPhoto"
                            @open-photo="openDescriptionPhoto"
                            :pictures="selectedCharacter.pictures">
                        </PictureBox>
                        <CollapsiblePanel v-if="!printMode && (typeof selectedCharacter !== 'undefined')" label="Identification">
                            <form class="large-max-width form-grid medium-padding">
                                <label>Name FR</label>
                                <input class="flex-grow-1" type="text" v-model="selectedCharacter.name.S" />
                                <label>Name EN</label>
                                <input class="flex-grow-1" type="text" v-model="selectedCharacter.name.EN" />
                                <label>Name CN</label>
                                <input class="flex-grow-1" type="text" v-model="selectedCharacter.name.CN" />
                                <label>Color</label>
                                <input class="flex-grow-1" type="color" v-model="selectedCharacter.color" />
                                <label class="item-property">Detail</label>
                                <textarea class="input-text" v-model="selectedCharacter.detail"></textarea>
                                <label class="item-property">Type</label>
                                <div>
                                    <label><input type="radio" value="discrete" v-model="selectedCharacter.characterType">Discrete</label>
                                    <label><input type="radio" value="range" v-model="selectedCharacter.characterType">Range</label>
                                </div>
                                <div class="display-contents" v-if="selectedCharacter.characterType === 'discrete'">
                                    <label class="item-property">Preset</label>
                                    <div>
                                        <label><input type="radio" value="" v-model="preset">None</label>
                                        <label><input type="radio" value="flowering" v-model="preset">Flowering</label>
                                    </div>
                                </div>
                            </form>
                        </CollapsiblePanel>
                        <CharactersTree v-if="!printMode && selectedCharacter && selectedCharacter.characterType === 'discrete' && !selectedCharacter.preset" class="flex-grow-1" :selected-character="selectedCharacter">
                        </CharactersTree>
                        <div v-if="!printMode && isFloweringCharacter" class="centered-text medium-margin thin-border medium-padding white-background">
                            <Flowering v-model="tracks" class="limited-width">
                            </Flowering>
                        </div>
                        <VBox v-if="!printMode && isMapCharacter" class="centered-text medium-margin thin-border medium-padding white-background">
                            <HBox>
                                <select v-if="maps.length > 0" name="lang" id="map-selector" v-model="selectedMapIndex">
                                    <option v-for="(map, i) in maps" :key="map.name" :value="i">{{ map.name }}</option>
                                </select>
                            </HBox>
                            <GeoView :v-if="selectedMap" :geo-map="selectedMap">
                            </GeoView>
                        </VBox>
                        <CollapsiblePanel v-if="selectedCharacter && selectedCharacter.characterType === 'range'" label="Range">
                            <div class="form-grid medium-padding">
                                <label for="range-unit">Unit</label>
                                <select name="range-unit" v-model="selectedCharacter.unit">
                                    <option v-for="unit in units" :value="unit">
                                        {{ unit.name.S }}
                                        <span v-if="unit.base">
                                            = {{ 1 / unit.base.factor }} {{ unit.base.unit.name.S }}
                                        </span>
                                    </option>
                                </select>
                            </div>
                        </CollapsiblePanel>
                        <CollapsiblePanel v-if="!printMode && selectedCharacter && selectedCharacter.path.length > 0" label="Dependencies">
                            <HBox>
                                <section v-if="isDiscreteCharacter" class="medium-margin medium-padding thin-border flex-grow-1">
                                    <label>Inherent State</label>
                                    <ul class="indented no-list-style">
                                        <li class="medium-padding" v-for="state in parentStates" :key="state.id">
                                            <label>
                                                <input type="radio" :checked="isInherentState(state)" name="inherent-state" @change="setCurrentInherentState(state)" />
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
                                                <input type="checkbox" @change="setCurrentRequiredState(state, ($event.target as any).checked)" :checked="selectedCharacter ? selectedCharacter.requiredStates.some(s => s.id === state.id) : false" />
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
                                            <input type="checkbox" @change="setCurrentInapplicableState(state, ($event.target as any).checked)" :checked="selectedCharacter ? selectedCharacter.inapplicableStates.some(s => s.id === state.id) : false" />
                                            {{ state.name.S }}
                                            </label>
                                        </li>
                                    </ul>
                                </section>
                            </HBox>
                        </CollapsiblePanel>
                        <label v-if="maybeInherentState">
                            <input type="checkbox"
                                @input="onlyAllowState(maybeInherentState)"
                                :checked="stateInAllowList(maybeInherentState)">
                            Only show taxons having it
                        </label>
                        <label v-if="maybeInherentState">
                            <input type="checkbox"
                                @input="denyState(maybeInherentState)"
                                :checked="stateInDenyList(maybeInherentState)">
                            Only show taxons without it
                        </label>
                    </VBox>
                </VBox>
                <VBox v-if="!printMode && selectedCharacter && selectedCharacter.characterType === 'discrete' && !selectedCharacter.preset" class="scroll relative">
                    <ColumnHeader class="stick-to-top" label="States" :hide-actions="true"></ColumnHeader>
                    <div class="medium-padding flex-grow-1">
                        <ul class="no-list-style flex-grow-1">
                            <li v-for="state in statesToDisplay" :key="state.id" class="white-background thin-border">
                                <VBox>
                                    <HBox class="thin-border center-items">
                                        <div class="button-group">
                                            <button @click="moveCurrentStateUp(state)">
                                                <font-awesome-icon icon="fa-solid fa-arrow-up" />
                                            </button>
                                            <button @click="moveCurrentStateDown(state)">
                                                <font-awesome-icon icon="fa-solid fa-arrow-down" />
                                            </button>
                                        </div>
                                        <label>
                                            Only show taxons having it<input name="allow" type="checkbox" @input="onlyAllowState(state)" :checked="stateInAllowList(state)">
                                        </label>
                                        <label>
                                            Only show taxons without it<input name="deny" type="checkbox" @input="denyState(state)" :checked="stateInDenyList(state)">
                                        </label>
                                        <Spacer></Spacer>
                                        <button @click="removeCurrentState(state)">
                                            <font-awesome-icon icon="fa-solid fa-close" />
                                        </button>
                                    </HBox>
                                    <label class="medium-padding rounded nowrap horizontal-flexbox">
                                        <div class="form-grid flex-grow-1">
                                            <label>Name FR</label><input type="text" class="flex-grow-1" v-model="state.name.S" />
                                            <label>Name EN</label><input type="text" class="flex-grow-1" v-model="state.name.EN" />
                                            <label>Name CN</label><input type="text" class="flex-grow-1" v-model="state.name.CN" />
                                            <label>Color</label><input type="color" v-model="state.color">
                                            <label>Description</label>
                                            <textarea v-model="state.detail" class="input-text" pleceholder="description"></textarea>
                                        </div>
                                        <PictureBox
                                            class="scroll"
                                            :editable="true"
                                            @add-photo="addStatePhoto(state, $event)"
                                            @set-photo="setStatePhoto(state, $event)"
                                            @delete-photo="deleteStatePhoto(state, $event)"
                                            @open-photo="openStatePhoto(state)"
                                            :pictures="state.pictures">
                                        </PictureBox>
                                    </label>
                                </VBox>
                            </li>
                        </ul>
                    </div>
                    <add-item class="stick-to-bottom" @add-item="addStateHandler" :name-fields="nameFields" :name-store="stateNameStore"></add-item>
                </VBox>
            </SplitPanel>
        </VBox>
    </SplitPanel>
</template>

<script lang="ts">
import AddItem from "./toolkit/AddItem.vue";
import HBox from "./toolkit/HBox.vue";
import VBox from "./toolkit/VBox.vue";
import TreeMenu from "./toolkit/TreeMenu.vue";
import UploadButton from "./toolkit/UploadButton.vue";
import CharactersTree from "./CharactersTree.vue";
import GeoView from "./GeoView.vue";
import Spacer from "./toolkit/Spacer.vue";
import SplitPanel from "./toolkit/SplitPanel.vue";
import CollapsiblePanel from "./toolkit/CollapsiblePanel.vue";
import PopupGalery from "./PopupGalery.vue";
import CharactersPresentation from "./CharactersPresentation.vue";
import ColumnHeader from "./toolkit/ColumnHeader.vue";
import Flowering from "./Flowering.vue";
import PictureBox from "./PictureBox.vue";
import { Character, State, Picture, standardMaps, GeoMap, createState, characterStates, CharacterPreset, standardUnitsList } from "@/datatypes";
import Months from "@/datatypes/Months";
import { createCharacter } from "@/datatypes/Character";
import { normalizePicture } from "@/datatypes/picture";
import { Language, characterNameStore, stateNameStore } from "@/db-index";
import { useHazoStore } from "@/stores/hazo";
import { useDatasetStore } from "@/stores/dataset";
import { mapActions, mapState } from "pinia";
import { getParentId, pathToItem } from "@/datatypes/Dataset";


export default {
    name: "CharactersTab",
    components: { AddItem, CollapsiblePanel, ColumnHeader, Flowering, GeoView, HBox, PictureBox, PopupGalery, Spacer, TreeMenu, CharactersTree, CharactersPresentation, SplitPanel, UploadButton, VBox },
    data() {
        const selectedCharacterId = (this.$route.params.id as string) ?? "";
        const dsStore = useDatasetStore();
        const selectedCharacter = dsStore.characterWithId(selectedCharacterId);
        let preset: CharacterPreset|undefined;
        if (selectedCharacter && selectedCharacter.characterType === "discrete" && selectedCharacter.preset) {
            preset = selectedCharacter.preset;
        }
        return {
            preset,
            units: standardUnitsList,
            nameStore: characterNameStore,
            stateNameStore: stateNameStore,
            nameFields: [{ label: 'FR', propertyName: 'S'}, { label: 'EN', propertyName: 'EN' }, { label: '中文名', propertyName: 'CN' }] satisfies Array<{ label: string, propertyName: Language }>,
            showLeftMenu: true,
            showBigImage: false,
            maps: standardMaps,
            selectedMapIndex: 0,
            bigImages: [{id: "", hubUrl: "", url: "", label: ""} as Picture],
            selectedCharacterId,
            printMode: false,
            tracks: [{ name: "test", color: selectedCharacter?.color ?? "#84bf3d", data: [] }],
        };
    },
    watch: {
        $route(to: any) {
            this.selectedCharacterId = to.params.id;
            if (this.selectedCharacter) {
                this.tracks[0].color = this.selectedCharacter.color ?? "#84bf3d";
                this.selectCharacter(this.selectedCharacter);
                const char = this.selectedCharacter;
                if (char.characterType === "discrete") {
                    if (char.preset === "map") {
                        const i = this.maps.findIndex(m => m.name === char.name.S);
                        if (i >= 0) {
                            this.selectedMapIndex = i;
                        }
                    }
                }
            }
        },
        preset() {
            this.syncPreset();
        },
    },
    computed: {
        ...mapState(useHazoStore, ["selectedCharacter", "statesAllowList", "statesDenyList"]),
        ...mapState(useDatasetStore, ["charactersHierarchy"]),
        selectedMap(): GeoMap|undefined {
            if (this.maps.length <= this.selectedMapIndex) { return undefined; }
            return this.maps[this.selectedMapIndex];
        },
        isDiscreteCharacter(): boolean {
            return this.selectedCharacter?.characterType === "discrete";
        },
        isFloweringCharacter(): boolean {
            if (!this.selectedCharacter || this.selectedCharacter.characterType !== "discrete") { return false; }
            return this.selectedCharacter?.preset === "flowering";
        },
        isMapCharacter(): boolean {
            if (!this.selectedCharacter || this.selectedCharacter.characterType !== "discrete") { return false; }
            return this.selectedCharacter?.preset === "map";
        },
        isRangeCharacter(): boolean {
            return this.selectedCharacter?.characterType === "range";
        },
        maybeInherentState(): State|undefined {
            const ch = this.selectedCharacter;
            return ch?.characterType === "range" ? undefined : ch?.inherentState;
        },
        selectedCharacter(): Character|undefined {
            return this.characterWithId(this.selectedCharacterId);
        },
        parentStates(): State[] {
            const parentId = this.selectedCharacter ? getParentId(this.selectedCharacter) : undefined;
            if (typeof parentId === "undefined")
                return[];
            const parent = this.characterWithId(parentId);
            if (typeof parent === "undefined")
                return[];
            return Array.from(characterStates(parent));
        },
        parentStatesExceptInherent(): State[] {
            const ch = this.selectedCharacter;
            return this.parentStates.filter(s => ch?.characterType === "range" || s.id !== ch?.inherentState?.id);
        },
        statesToDisplay(): Array<State> {
            const childrenInherentStateIds = this.selectedCharacter?.children
                .map(c => c.characterType === "range" ? undefined : c.inherentState?.id)
                .filter(s => typeof s !== "undefined") ?? [];
            return Array.from(characterStates(this.selectedCharacter)).
                filter(s => !childrenInherentStateIds.includes(s.id));
        },
    },
    methods: {
        ...mapActions(useHazoStore, ["addStateToAllowList", "addStateToDenyList", "copyCharacter", "copyStates", "pasteCharacter", "pasteStates", "removeStateFromAllowList", "removeStateFromDenyList", "selectCharacter", "unselectCharacter"]),
        ...mapActions(useDatasetStore, [
            "addCharacter", "removeCharacter", 
            "moveCharacterDown", "moveCharacterUp",
            "addCharacterPicture", "setCharacterPicture", "removeCharacterPicture",
            "characterWithId", "setStates", 
            "addState", "removeState",
            "moveStateDown", "moveStateUp",
            "addStatePicture", "setStatePicture", "removeStatePicture",
            "setInapplicableState", "setInherentState", "setRequiredState",
        ]),
        syncPreset() {
            if (typeof this.selectedCharacter === "undefined") { return; }
            const character = this.selectedCharacter;
            if (character.characterType === "discrete") {
                character.preset = this.preset;
                if (character.preset === "flowering") {
                    this.setStates({ states: Months.NAMES.map(name => createState({
                        path: [...character.path, character.id],
                        name: { S: name, FR: name, EN: name },
                    })), character });
                }
            }
        },
        isInherentState(state: State): boolean {
            const ch = this.selectedCharacter;
            return ch?.characterType === "discrete" && ch.inherentState ? ch.inherentState.id === state.id : false
        },
        stateInAllowList(state: State): boolean {
            return this.statesAllowList.some(s => s.id === state.id);
        },
        stateInDenyList(state: State): boolean {
            return this.statesDenyList.some(s => s.id === state.id);
        },
        onlyAllowState(state: State|undefined) {
            if (!state) return;
            if (this.stateInAllowList(state)) {
                this.removeStateFromAllowList(state);
            } else {
                this.addStateToAllowList(state);
            }
        },
        denyState(state: State|undefined) {
            if (!state) return;
            if (this.stateInDenyList(state)) {
                this.removeStateFromDenyList(state);
            } else {
                this.addStateToDenyList(state);
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
                this.copyCharacter(this.selectedCharacter);
            }
        },
        pasteItem() {
            this.pasteCharacter(this.selectedCharacterId);
        },
        copyCurrentStates() {
            this.copyStates(Array.from(characterStates(this.selectedCharacter)));
        },
        pasteCurrentStates() {
            this.pasteStates(this.selectedCharacterId);
        },
        moveUp(item: Character) {
            this.moveCharacterUp(item);
        },
        moveDown(item: Character) {
            this.moveCharacterDown(item);
        },
        setCurrentInapplicableState(state: State, selected: boolean) {
            if (this.selectedCharacter?.characterType === "discrete") {
                this.setInapplicableState({ character: this.selectedCharacter!, state, selected });
            }
        },
        setCurrentRequiredState(state: State, selected: boolean) {
            if (this.selectedCharacter?.characterType === "discrete") {
                this.setRequiredState({ character: this.selectedCharacter!, state, selected });
            }
        },
        setCurrentInherentState(state: State) {
            if (this.selectedCharacter?.characterType === "discrete") {
                this.setInherentState({ character: this.selectedCharacter!, state });
            }
        },
        addCharacterPhoto(e: {detail: {value: string[]}}) {
            if (!this.selectedCharacter) { return; }

            const [url, label] = e.detail.value;
            const numberOfPhotos = this.selectedCharacter!.pictures.length;
            this.addCharacterPicture({
                character: this.selectedCharacter,
                picture: normalizePicture({
                    id: `${this.selectedCharacter!.id}-${numberOfPhotos}`,
                    path: pathToItem(this.selectedCharacter),
                    url: url,
                    label: label ?? `${this.selectedCharacter!.name} #${numberOfPhotos}`,
                    hubUrl: undefined,
                })
            });
        },
        setCharacterPhoto(e: {detail: {index: number, src: string, hubUrl: string}}) {
            if (!this.selectedCharacter) { return; }

            this.setCharacterPicture({
                character: this.selectedCharacter,
                index: e.detail.index,
                picture: normalizePicture({ ...this.selectedCharacter.pictures[e.detail.index], url: e.detail.src, hubUrl: e.detail.hubUrl })
            });
        },
        deleteCharacterPhoto(e: {detail: {index: number}}) {
            if (!this.selectedCharacter) { return; }

            this.removeCharacterPicture({ character: this.selectedCharacter, index: e.detail.index });
        },
        addStatePhoto(state: State, e: {detail: {value: string}}) {
            if (this.selectedCharacter?.characterType !== "discrete") return;
            const numberOfPhotos = state.pictures.length;
            this.addStatePicture({
                character: this.selectedCharacter,
                state: state,
                picture: normalizePicture({
                    id: `${state.id}-${numberOfPhotos}`,
                    path: pathToItem(state),
                    url: e.detail.value,
                    label: e.detail.value,
                    hubUrl: undefined,
                })
            });
        },
        setStatePhoto(state: State, e: {detail: {index: number, src: string, hubUrl: string}}) {
            if (this.selectedCharacter?.characterType !== "discrete") return;
            if (state) {
                this.setStatePicture({
                    character: this.selectedCharacter,
                    state: state,
                    index: e.detail.index,
                    picture: normalizePicture({ ...state.pictures[e.detail.index], url: e.detail.src, hubUrl: e.detail.hubUrl }),
                });
            }
        },
        deleteStatePhoto(state: State, e: {detail: {index: number}}) {
            if (this.selectedCharacter?.characterType === "discrete") {
                this.removeStatePicture({ character: this.selectedCharacter, state: state, index: e.detail.index });
            }
        },
        openStatePhoto(state: State) {
            this.showBigImage = true;
            this.bigImages = state.pictures;
        },
        addCharacterHandler(e: { value: string[], path: string[] }) {
            const [name, nameEN, nameCN] = e.value;
            this.addCharacter(createCharacter({
                path: e.path,
                name: { S: name, FR: name, EN: nameEN, CN: nameCN },
            }));
        },
        addStateHandler(e: {detail: string[]}) {
            if (this.selectedCharacter?.characterType !== "discrete") return;
            if (typeof this.selectedCharacter === "undefined") throw "addState failed: description is undefined.";
            const [name, nameEN, nameCN, color, description] = e.detail;
            const parent = this.selectedCharacter;
            this.addState({
                state: {
                    id: "",
                    path: pathToItem(parent),
                    type: "state",
                    name: { S: name, FR: name, EN: nameEN, CN: nameCN },
                    color,
                    detail: description,
                    pictures: []
                },
                character: this.selectedCharacter,
            });
        },
        moveCurrentStateUp(state: State) {
            if (this.selectedCharacter?.characterType !== "discrete") return;
            if (typeof this.selectedCharacter === "undefined") return;
            this.moveStateUp({ character: this.selectedCharacter, state });
        },
        moveCurrentStateDown(state: State) {
            if (this.selectedCharacter?.characterType !== "discrete") return;
            if (typeof this.selectedCharacter === "undefined") return;
            this.moveStateDown({ character: this.selectedCharacter, state });
        },
        removeCurrentState(state: State) {
            if (this.selectedCharacter?.characterType !== "discrete") return;
            this.removeState({ character: this.selectedCharacter!, state });
        },
        openDescriptionPhoto() {
            this.showBigImage = true;
            this.bigImages = this.selectedCharacter!.pictures;
        },
    }
};
</script>@/stores/store