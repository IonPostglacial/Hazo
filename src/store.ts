import Vue from "vue";
import { VueConstructor } from 'vue/types/umd';
import Vuex from "vuex";

import { Character, CharactersHierarchy, DictionaryEntry, Field, Hierarchy, standardBooks, State, Taxon } from "./bunga";
import { Picture } from "./bunga/datatypes";
import clone from "./clone";
import { ObservableMap } from "./observablemap";

export type BungaStore = ReturnType<typeof createStore>;

abstract class BungaVueClass extends Vue {
    public $store!: BungaStore;
}

export const BungaVue = (Vue as VueConstructor<BungaVueClass>);

function setState(states: State[], state: State, selected: boolean) {
    if (selected) {
        states.push(state);
    } else {
        const i = states.findIndex(s => s.id === state.id);
        if (i >= 0) {
            states.splice(i, 1);
        }
    }
}

export function createStore() {
    return new Vuex.Store({
        state: {
            extraFields: new Array<Field>(),
            books: standardBooks,
            taxonsHierarchy: new Hierarchy<Taxon>("t", new ObservableMap()),
            charactersHierarchy: new CharactersHierarchy("d", new ObservableMap()),
            dictionaryEntries: {} as Record<string, DictionaryEntry>,
            copiedTaxon: null as null|Hierarchy<Taxon>,
            copiedCharacter: null as null|Hierarchy<Character>,
        },
        mutations: {
            copyTaxon(state, taxon: Taxon) {
                state.copiedTaxon = state.taxonsHierarchy.extractHierarchy(taxon);
            },
            pasteTaxon(state, targetId: string) {
                if (state.copiedTaxon !== null) {
                    state.taxonsHierarchy.addHierarchy(state.copiedTaxon, targetId);
                }
            },
            addTaxon(state, taxon: Taxon) {
                state.taxonsHierarchy.add(taxon);
            },
            addTaxons(state, taxons: Taxon[]) {
                taxons.forEach(t => state.taxonsHierarchy.add(t));
            },
            removeTaxon(state, taxon: Taxon) {
                state.taxonsHierarchy.remove(taxon);
            },
            changeTaxonParent(state, e: { taxon: Taxon, newParentId: string }) {
                if (e.taxon.id === e.newParentId) return;

                const childrenTree = [...state.taxonsHierarchy.getOrderedChildrenTree(e.taxon)];

                state.taxonsHierarchy.remove(e.taxon);
                e.taxon.parentId = e.newParentId;
                state.taxonsHierarchy.add(e.taxon);
                for (const child of childrenTree) {
                    state.taxonsHierarchy.add(child);
                }
            },
            addTaxonPicture(state, payload: { taxon: Taxon, picture: Picture }) {
                payload.taxon.photos.push(payload.picture);
            },
            setTaxonPicture(state, payload: { taxon: Taxon, picture: Picture, index: number }) {
                payload.taxon.photos[payload.index] = payload.picture;
            },
            removeTaxonPicture(state, payload: { taxon: Taxon, index: number }) {
                payload.taxon.photos.splice(payload.index, 1);
            },
            copyCharacter(state, character: Character) {
                state.copiedCharacter = state.charactersHierarchy.extractHierarchy(character);
            },
            pasteCharacter(state, targetId: string) {
                if (state.copiedCharacter !== null) {
                    state.charactersHierarchy.addHierarchy(state.copiedCharacter, targetId);
                }
            },
            addCharacter(state, character: Character) {
                state.charactersHierarchy.add(character);
            },
            addCharacters(state, characters: Character[]) {
                characters.forEach(c => state.charactersHierarchy.add(c));
            },
            removeCharacter(state, character: Character) {
                state.charactersHierarchy.remove(character);
            },
            addCharacterPicture(state, payload: { character: Character, picture: Picture }) {
                payload.character.photos.push(payload.picture);
            },
            setCharacterPicture(state, payload: { character: Character, picture: Picture, index: number }) {
                payload.character.photos[payload.index] = payload.picture;
            },
            removeCharacterPicture(state, payload: { character: Character, index: number }) {
                payload.character.photos.splice(payload.index, 1);
            },
            addState(state, e: { state: State, character: Character }) {
                state.charactersHierarchy.addState(e.state);
            },
            removeState(state, e: { state: State, character: Character }) {
                state.charactersHierarchy.removeState(e.state);
                function removeStateFromSelection(stateSelection: Record<string, boolean|undefined>, state: State) {
                    for (const stateId in stateSelection) {
                        if (stateId === state.id) {
                            delete stateSelection[stateId];
                        }
                    }
                }
                for (const taxon of state.taxonsHierarchy.allItems) {
                    removeStateFromSelection(taxon.statesSelection, e.state);
                }
            },
            addStatePicture(state, payload: { state: State, picture: Picture }) {
                payload.state.photos.push(payload.picture);
            },
            setStatePicture(state, payload: { state: State, picture: Picture, index: number }) {
                payload.state.photos[payload.index] = payload.picture;
            },
            removeStatePicture(state, payload: { state: State, index: number }) {
                payload.state.photos.splice(payload.index, 1);
            },
            setInapplicableState(state, payload: { state: State, selected: boolean }) {
                const character = state.charactersHierarchy.itemWithId(payload.state.descriptorId);
                if (typeof character === "undefined") return;

                setState(character.inapplicableStates, payload.state, payload.selected);
                state.charactersHierarchy.add(clone(character));
            },
            setRequiredState(state, payload: { state: State, selected: boolean }) {
                const character = state.charactersHierarchy.itemWithId(payload.state.descriptorId);
                if (typeof character === "undefined") return;

                setState(character.requiredStates, payload.state, payload.selected);
                state.charactersHierarchy.add(clone(character));
            },
            setInherentState(state, payload: { state: State }) {
                const character = state.charactersHierarchy.itemWithId(payload.state.descriptorId);
                if (typeof character === "undefined") return;

                character.inherentState = payload.state;
                
                setState(character.requiredStates, payload.state, false);
                setState(character.inapplicableStates, payload.state, false);
            },
            addDictionaryEntry(state, entry: DictionaryEntry) {
                Vue.set(state.dictionaryEntries, entry.id, entry);
            },
            addDictionaryEntries(state, entries: Array<DictionaryEntry>) {
                entries.forEach(e => Vue.set(state.dictionaryEntries, e.id, e));
            },
            addExtraField(state, {detail} : {detail: string}) {
                state.extraFields.push({ id: detail, std: false, label: detail, icon: "" });
            },
            removeExtraField(state, id:string) {
                const i = state.extraFields.findIndex(f => f.id === id);
                if (i >= 0) {
                    state.extraFields.splice(i, 1);
                }
            },
        }
    });
}