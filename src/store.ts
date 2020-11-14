import Vue from "vue";
import { VueConstructor } from 'vue/types/umd';
import Vuex from "vuex";

import { Character, DictionaryEntry, Field, Hierarchy, HierarchicalItem, standardBooks, State, Taxon } from "./bunga";
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
            charactersHierarchy: new Hierarchy<Character>("d", new ObservableMap()),
            dictionaryEntries: {} as Record<string, DictionaryEntry>,
        },
        mutations: {
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
                this.addTaxon(state, e.taxon);
                for (const child of childrenTree) {
                    this.addTaxon(state, child);
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
            addCharacter(state, character: Character) {
                if (character.id === "") {
                    const newCharacter = state.charactersHierarchy.add(character);
                    const parentDescription = state.charactersHierarchy.itemWithId(character.parentId);
                    if(typeof character.parentId !== "undefined" && typeof parentDescription !== "undefined") {
                        const newState: State = {
                            id: "s-auto-" + newCharacter.id,
                            descriptorId: character.parentId, name: newCharacter.name, nameEN: "", nameCN: "", photos: []
                        };
                        parentDescription.states = [...parentDescription.states, newState];
                        newCharacter.inherentState = newState;
                    }
                } else {
                    state.charactersHierarchy.add(character);
                }
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
                state.charactersHierarchy.itemWithId(e.character.id)!.states.push(e.state);
            },
            removeState(state, e: { state: State, character: Character }) {
                function removeStateFromArray(array: State[], state: State) {
                    const index = array.findIndex(s => s.id === state.id);
                    if (index >= 0) {
                        array.splice(index, 1);
                    }
                }

                removeStateFromArray(e.character.states, e.state);
                removeStateFromArray(e.character.inapplicableStates, e.state);
                removeStateFromArray(e.character.requiredStates, e.state);
                if (e.character.inherentState?.id === e.state.id) {
                    e.character.inherentState = undefined;
                }

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