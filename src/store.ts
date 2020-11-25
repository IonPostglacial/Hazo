import Vue from "vue";
import { VueConstructor } from 'vue/types/umd';
import Vuex from "vuex";

import { Character, CharactersHierarchy, DictionaryEntry, Field, Hierarchy, standardBooks, State, Taxon } from "./bunga";
import { Dataset } from './bunga/Dataset';
import { Picture } from "./bunga/datatypes";
import { ManyToManyBimap } from './tools/bimaps';
import clone from "./tools/clone";
import makeid from './tools/makeid';
import { ObservableMap } from "./tools/observablemap";

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
            dataset: new Dataset("",
                new Hierarchy<Taxon>("t", new ObservableMap()),
                new CharactersHierarchy("d", new ObservableMap()),
                {},
                new ManyToManyBimap(ObservableMap),
                standardBooks,
                new Array<Field>(),
                {}
            ),
            copiedTaxon: null as null|Hierarchy<Taxon>,
            copiedCharacter: null as null|Hierarchy<Character>,
            copiedStates: [] as State[]
        },
        mutations: {
            copyTaxon(state, taxon: Taxon) {
                state.copiedTaxon = state.dataset.taxonsHierarchy.extractHierarchy(taxon);
            },
            pasteTaxon(state, targetId: string) {
                if (state.copiedTaxon !== null) {
                    state.dataset.taxonsHierarchy.addHierarchy(state.copiedTaxon, targetId);
                }
            },
            addTaxon(state, taxon: Taxon) {
                state.dataset.addTaxon(taxon);
            },
            addTaxons(state, taxons: Taxon[]) {
                taxons.forEach(t => state.dataset.addTaxon(t));
            },
            removeTaxon(state, taxon: Taxon) {
                state.dataset.removeTaxon(taxon);
            },
            changeTaxonParent(state, e: { taxon: Taxon, newParentId: string }) {
                state.dataset.changeTaxonParent(e.taxon, e.newParentId);
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
                state.copiedCharacter = state.dataset.charactersHierarchy.extractHierarchy(character);
            },
            pasteCharacter(state, targetId: string) {
                if (state.copiedCharacter !== null) {
                    state.dataset.charactersHierarchy.addHierarchy(state.copiedCharacter, targetId);
                }
            },
            copyStates(state, states: State[]|undefined) {
                if (typeof states !== "undefined") {
                    state.copiedStates = clone(states);
                    state.copiedStates.forEach(s => s.id = "s-" + makeid(8));
                }
            },
            pasteStates(state, characterId: string) {
                const character = state.dataset.charactersHierarchy.itemWithId(characterId);

                if (typeof character !== "undefined") {
                    character.states.push(...state.copiedStates);
                }
            },
            addCharacter(state, character: Character) {
                state.dataset.addCharacter(character);
            },
            addCharacters(state, characters: Character[]) {
                characters.forEach(c => state.dataset.addCharacter(c));
            },
            removeCharacter(state, character: Character) {
                state.dataset.removeCharacter(character);
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
                state.dataset.addState(e.state);
            },
            removeState(state, e: { state: State, character: Character }) {
                state.dataset.removeState(e.state);
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
                const character = state.dataset.charactersHierarchy.itemWithId(payload.state.descriptorId);
                if (typeof character === "undefined") return;

                setState(character.inapplicableStates, payload.state, payload.selected);
                state.dataset.charactersHierarchy.add(clone(character));
            },
            setRequiredState(state, payload: { state: State, selected: boolean }) {
                const character = state.dataset.charactersHierarchy.itemWithId(payload.state.descriptorId);
                if (typeof character === "undefined") return;

                setState(character.requiredStates, payload.state, payload.selected);
                state.dataset.charactersHierarchy.add(clone(character));
            },
            setInherentState(state, payload: { state: State }) {
                const character = state.dataset.charactersHierarchy.itemWithId(payload.state.descriptorId);
                if (typeof character === "undefined") return;

                character.inherentState = payload.state;
                
                setState(character.requiredStates, payload.state, false);
                setState(character.inapplicableStates, payload.state, false);
            },
            setTaxonState(state, p: { taxon: Taxon, state: State, has: boolean }) {
                if (p.has) {
                    state.dataset.statesByTaxons.add(p.taxon.id, p.state.id);
                } else {
                    state.dataset.statesByTaxons.remove(p.taxon.id, p.state.id);
                }
            },
            addDictionaryEntry(state, entry: DictionaryEntry) {
                Vue.set(state.dataset.dictionaryEntries, entry.id, entry);
            },
            addDictionaryEntries(state, entries: Array<DictionaryEntry>) {
                entries.forEach(e => Vue.set(state.dataset.dictionaryEntries, e.id, e));
            },
            addExtraField(state, {detail} : {detail: string}) {
                state.dataset.extraFields.push({ id: detail, std: false, label: detail, icon: "" });
            },
            removeExtraField(state, id: string) {
                const i = state.dataset.extraFields.findIndex(f => f.id === id);
                if (i >= 0) {
                    state.dataset.extraFields.splice(i, 1);
                }
            },
            resetData(state) {
                state.dataset.taxonsHierarchy.clear();
                state.dataset.charactersHierarchy.clear();
            },
        }
    });
}