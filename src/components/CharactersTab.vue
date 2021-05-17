<template>
    <div class="horizontal-flexbox start-align flex-grow-1 scroll">
        <nav v-if="showLeftMenu" class="scroll white-background">
            <TreeMenu editable :items="charactersHierarchy" name="description"
                :name-fields="[{ label: 'Name', propertyName: 'S'}, { label: '中文名', propertyName: 'CN' }]"
                @select-item="selectCharacter" :selected-item="selectedCharacter ? selectedCharacter.id : ''"
                @add-item="addCharacter"
                @unselected="selectedCharacterId = undefined" @delete-item="deleteCharacter" v-slot="menuProps">
                <router-link class="flex-grow-1 nowrap unstyled-anchor" :to="'/characters/' + menuProps.item.id">{{ menuProps.item.name }}</router-link>
            </TreeMenu>
        </nav>
        <div v-if="(typeof selectedCharacter !== 'undefined')" ref="printtemplate" class="invisible">
            <characters-presentation v-if="(typeof selectedCharacter !== 'undefined')"
                :dataset="dataset"
                :character="selectedCharacter">
            </characters-presentation>
        </div>
        <popup-galery :images="bigImages" :open="showBigImage" @closed="showBigImage = false"></popup-galery>
        <section class="scroll vertical-flexbox flex-grow-1">
            <div class="horizontal-flexbox medium-padding thin-border">
                <button type="button" @click="showLeftMenu = !showLeftMenu">Left Menu</button>
                <button type="button" @click="printPresentation">Print</button>
                <div class="button-group">
                    <button v-if="(typeof selectedCharacter !== 'undefined')" type="button" @click="copyItem">Copy</button>
                    <button type="button" @click="pasteItem">Paste</button>
                    <button v-if="(typeof selectedCharacter !== 'undefined')" type="button" @click="copyStates">Copy States</button>
                    <button type="button" @click="pasteStates">Paste States</button>
                </div>
            </div>
            <picture-box v-if="(typeof selectedCharacter !== 'undefined')" editable="editable"
                    @add-photo="addCharacterPhoto"
                    @set-photo="setCharacterPhoto"
                    @delete-photo="deleteCharacterPhoto"
                    @open-photo="openDescriptionPhoto">
                <picture-frame v-for="(photo, index) in selectedCharacter.pictures" :key="photo.id"
                    :pictureid="photo.id" :url="photo.url" :label="photo.label" :index="index" editable="true"></picture-frame>
            </picture-box>
            <collapsible-panel v-if="(typeof selectedCharacter !== 'undefined')" label="Identification">
                <table>
                    <tr>
                        <th></th>
                        <th>FR</th>
                        <th>EN</th>
                        <th>CN</th>
                    </tr>
                    <tr>
                        <th>Name</th>
                        <td><input class="flex-grow-1" type="text" v-model="selectedCharacter.name.FR" /></td>
                        <td><input class="flex-grow-1" type="text" v-model="selectedCharacter.name.EN" /></td>
                        <td><input class="flex-grow-1" type="text" v-model="selectedCharacter.name.CN" /></td>
                    </tr>
                </table>
                <label class="item-property">Detail</label>
                <textarea class="input-text" v-model="selectedCharacter.detail"></textarea>
            </collapsible-panel>
            <characters-tree v-if="selectedCharacter" class="flex-grow-1 limited-width" :selected-character="selectedCharacter">
            </characters-tree>
            <collapsible-panel v-if="selectedCharacter && selectedCharacter.parentId" label="Dependencies">
                <div class="horizontal-flexbox">
                    <section class="medium-margin medium-padding thin-border flex-grow-1">
                        <label>Inherent State</label>
                        <ul class="indented no-list-style">
                            <li class="medium-padding" v-for="state in parentStates" :key="state.id">
                                <label>
                                    <input type="radio" :checked="selectedCharacter.inherentState ? selectedCharacter.inherentState.id === state.id : false" name="inherent-state" @change="setInherentState(state)" />
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
                                    <input type="checkbox" @change="setRequiredState(state, $event.target.checked)" :checked="selectedCharacter.requiredStates.find(s => s.id === state.id)" />
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
                                <input type="checkbox" @change="setInapplicableState(state, $event.target.checked)" :checked="selectedCharacter.inapplicableStates.find(s => s.id === state.id)" />
                                {{ state.name.S }}
                                </label>
                            </li>
                        </ul>
                    </section>
                </div>
            </collapsible-panel>
        </section>
        <section v-if="(typeof selectedCharacter !== 'undefined')" class="scroll relative horizontal-flexbox">
            <collapsible-panel label="States">
                <div class="scroll medium-padding white-background">
                    <ul class="no-list-style medium-padding medium-margin">
                        <li v-for="state in dataset.charactersHierarchy.characterStates(selectedCharacter) || []" :key="state.id" class="display-contents">
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
                                        editable="true"
                                        @add-photo="addStatePhoto(state, $event)"
                                        @set-photo="setStatePhoto(state, $event)"
                                        @delete-photo="deleteStatePhoto(state, $event)"
                                        @open-photo="openStatePhoto(state, $event)">
                                    <picture-frame v-for="(photo, index) in state.pictures" :key="photo.id"      
                                        :pictureid="photo.id" :url="photo.url" :label="photo.label" :index="index" :editable="true">
                                    </picture-frame>
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
    </div>
</template>
<script lang="ts">
import TreeMenu from "./TreeMenu.vue";
import CharactersTree from "./CharactersTree.vue";
import PopupGalery from "./PopupGalery.vue";
import CharactersPresentation from "./CharactersPresentation.vue";
import Vue, { PropType } from "vue"; // eslint-disable-line no-unused-vars
import { Dataset, DetailData, Character, HierarchicalItem, Hierarchy, Picture, State } from "@/datatypes"; // eslint-disable-line no-unused-vars
import { CharactersHierarchy } from "@/datatypes/CharactersHierarchy";

export default Vue.extend({
    name: "CharactersTab",
    components: { PopupGalery, TreeMenu, CharactersTree, CharactersPresentation },
    data() {
        return {
            store: Hazo.store,
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
        dataset(): Dataset {
            return this.store.dataset;
        },
        charactersHierarchy(): CharactersHierarchy {
            return this.store.dataset.charactersHierarchy;
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
            return Array.from(this.dataset.charactersHierarchy.characterStates(parent));
        },
        parentStatesExceptInherent(): State[] {
            return this.parentStates.filter(s => s.id !== this.selectedCharacter?.inherentState?.id);
        },
    },
    methods: {
        printPresentation() {
            console.log(this.$refs);
            const divContents = (this.$refs.printtemplate as HTMLElement).innerHTML;
            if (!divContents) return;
            const a = window.open('', '', 'height=800, width=600');
            if (!a) return;
            a.document.write('<html>');
            a.document.write('<head><link rel="stylesheet" href="style.css"></head>');
            a.document.write('<body>');
            a.document.write(divContents);
            a.document.write('</body></html>');
            a.document.close();
            a.addEventListener("load", () => a.print());
        },
        copyItem() {
            if (this.selectedCharacter) {
                this.store.copyCharacter(this.selectedCharacter);
            }
        },
        pasteItem() {
            this.store.pasteCharacter(this.selectedCharacterId);
        },
        copyStates() {
            this.store.copyStates(Array.from(this.dataset.charactersHierarchy.characterStates(this.selectedCharacter)));
        },
        pasteStates() {
            this.store.pasteStates(this.selectedCharacterId);
        },
        setInapplicableState(state: State, selected: boolean) {
            this.store.setInapplicableState({ state, selected });
        },
        setRequiredState(state: State, selected: boolean) {
            this.store.setRequiredState({ state, selected });
        },
        setInherentState(state: State) {
            this.store.setInherentState({ state });
        },
        selectCharacter(id: string) {
            this.selectedCharacterId = id;
        },
        addCharacterPhoto(e: {detail: {value: string[]}}) {
            if (!this.selectedCharacter) { return; }

            const [url, label] = e.detail.value;
            const numberOfPhotos = this.selectedCharacter!.pictures.length;
            this.store.addCharacterPicture({
                character: this.selectedCharacter,
                picture: {
                    id: `${this.selectedCharacter!.id}-${numberOfPhotos}`,
                    url: url,
                    label: label ?? `${this.selectedCharacter!.name} #${numberOfPhotos}`,
                }
            });
        },
        setCharacterPhoto(e: {detail: {index: number, value: string}}) {
            if (!this.selectedCharacter) { return; }

            this.store.setCharacterPicture({
                character: this.selectedCharacter,
                index: e.detail.index,
                picture: { ...this.selectedCharacter?.pictures[e.detail.index], url: e.detail.value }
            });
        },
        deleteCharacterPhoto(e: {detail: {index: number}}) {
            if (!this.selectedCharacter) { return; }

            this.store.removeCharacterPicture({ character: this.selectedCharacter, index: e.detail.index });
        },
        addStatePhoto(state: State, e: {detail: {value: string}}) {
            const numberOfPhotos = state.pictures.length;
            this.store.addStatePicture({
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
                this.store.setStatePicture({
                    state: state,
                    index: e.detail.index,
                    picture: { ...state.pictures[e.detail.index], url: e.detail.value },
                });
            }
        },
        deleteStatePhoto(state: State, e: {detail: {index: number}}) {
            this.store.removeStatePicture({ state: state, index: e.detail.index });
        },
        openStatePhoto(state: State, e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.showBigImage = true;
            this.bigImages = state.pictures;
        },
        addCharacter(e: { value: string[], parentId: string }) {
            const [name, nameCN] = e.value;
            this.store.addCharacter(new Character({
                ...new DetailData({ id: "", name: { S: name, FR: name, CN: nameCN } }),
                parentId: e.parentId,
            }));
        },
        deleteCharacter(e: { itemId: string}) {
            const characterToDelete = this.charactersHierarchy?.itemWithId(e.itemId);
            if (typeof characterToDelete !== "undefined") {
                this.store.removeCharacter(characterToDelete);
            } else {
                console.warn(`Trying to delete character with id ${e.itemId} which doesn't exist.`, this.charactersHierarchy);
            }
        },
        addState(e: {detail: string[]}) {
            if (typeof this.selectedCharacter === "undefined") throw "addState failed: description is undefined.";
            const [name, nameEN, nameCN, color, description] = e.detail;
            this.store.addState({
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
        removeState(state: State) {
            this.store.removeState(state);
        },
        openDescriptionPhoto(e: Event & {detail: { index: number }}) {
            e.stopPropagation();
            this.showBigImage = true;
            this.bigImages = this.selectedCharacter!.pictures;
        },
    }
});
</script>