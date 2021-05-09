import Vue from "vue";

import { Character, CharactersHierarchy, DictionaryEntry, Field, Picture, Hierarchy, standardBooks, Taxon } from "./datatypes";
import { Dataset } from './datatypes/Dataset';
import { State } from "./datatypes/types";
import { ManyToManyBimap, OneToManyBimap } from './tools/bimaps';
import clone from "./tools/clone";
import makeid from './tools/makeid';
import { ObservableMap } from "./tools/observablemap";

export type HazoStore = ReturnType<typeof createStore>;

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
    return {
        dataset: new Dataset("",
            new Hierarchy<Taxon>("t", new ObservableMap()),
            new CharactersHierarchy("d", new ObservableMap(), new ObservableMap(), new OneToManyBimap(ObservableMap)),
            new ManyToManyBimap(ObservableMap),
            new ObservableMap(),
            standardBooks,
            new Array<Field>(),
        ),
        connectedToHub: false,
        copiedTaxon: null as null | Hierarchy<Taxon>,
        copiedCharacter: null as null | Hierarchy<Character>,
        copiedStates: [] as State[],
        get charactersHierarchy() {
            return this.dataset.charactersHierarchy;
        },
        setConnectedToHub(connectedToHub: boolean) {
            this.connectedToHub = connectedToHub;
        },
        copyTaxon(taxon: Taxon) {
            this.copiedTaxon = this.dataset.taxonsHierarchy.extractHierarchy(taxon);
        },
        pasteTaxon(targetId: string) {
            if (this.copiedTaxon !== null) {
                this.dataset.taxonsHierarchy.addHierarchy(this.copiedTaxon, targetId);
            }
        },
        addTaxonHierarchy(taxonHierarchy: Hierarchy<Taxon>) {
            this.dataset.taxonsHierarchy.addHierarchy(taxonHierarchy, undefined);
        },
        addTaxon(taxon: Taxon) {
            this.dataset.addTaxon(taxon);
        },
        addTaxons(taxons: Taxon[]) {
            taxons.forEach(t => this.dataset.addTaxon(t));
        },
        removeTaxon(taxon: Taxon) {
            this.dataset.removeTaxon(taxon);
        },
        changeTaxonParent(e: { taxon: Taxon, newParentId: string }) {
            this.dataset.changeTaxonParent(e.taxon, e.newParentId);
        },
        addTaxonPicture(payload: { taxon: Taxon, picture: Picture }) {
            payload.taxon.pictures.push(payload.picture);
        },
        setTaxonPicture(payload: { taxon: Taxon, picture: Picture, index: number }) {
            payload.taxon.pictures[payload.index] = payload.picture;
        },
        setTaxonLocations(payload: { taxon: Taxon, positions: { lat: number, lng: number }[] }) {
            payload.taxon.specimenLocations = payload.positions;
        },
        removeTaxonPicture(payload: { taxon: Taxon, index: number }) {
            payload.taxon.pictures.splice(payload.index, 1);
        },
        copyCharacter(character: Character) {
            this.copiedCharacter = this.dataset.charactersHierarchy.extractHierarchy(character);
        },
        pasteCharacter(targetId: string) {
            if (this.copiedCharacter !== null) {
                this.dataset.charactersHierarchy.addHierarchy(this.copiedCharacter, targetId);
            }
        },
        copyStates(states: State[] | undefined) {
            if (typeof states !== "undefined") {
                this.copiedStates = clone(states);
                this.copiedStates.forEach(s => s.id = "s-" + makeid(8));
            }
        },
        pasteStates(characterId: string) {
            for (const s of this.copiedStates) {
                const stateToAdd = clone(s);
                const character = this.dataset.charactersHierarchy.itemWithId(characterId);
                if (typeof character !== "undefined") {
                    this.dataset.charactersHierarchy.addState(stateToAdd, character);
                }
            }
        },
        addCharacterHierarchy(characterHierarchy: Hierarchy<Character>) {
            this.dataset.charactersHierarchy.addHierarchy(characterHierarchy, undefined);
        },
        addCharacter(character: Character) {
            this.dataset.addCharacter(character);
        },
        addCharacters(characters: Character[]) {
            characters.forEach(c => this.dataset.addCharacter(c));
        },
        removeCharacter(character: Character) {
            this.dataset.removeCharacter(character);
        },
        addCharacterPicture(payload: { character: Character, picture: Picture }) {
            payload.character.pictures.push(payload.picture);
        },
        setCharacterPicture(payload: { character: Character, picture: Picture, index: number }) {
            payload.character.pictures[payload.index] = payload.picture;
        },
        removeCharacterPicture(payload: { character: Character, index: number }) {
            payload.character.pictures.splice(payload.index, 1);
        },
        setDataset(dataset: Dataset) {
            Object.assign(this.dataset, dataset);
        },
        addState(payload: { state: State, character: Character }) {
            this.dataset.charactersHierarchy.addState(payload.state, payload.character);
        },
        removeState(hazoState: State) {
            this.dataset.charactersHierarchy.removeState(hazoState);
        },
        addStatePicture(payload: { state: State, picture: Picture }) {
            payload.state.pictures.push(payload.picture);
        },
        setStatePicture(payload: { state: State, picture: Picture, index: number }) {
            payload.state.pictures[payload.index] = payload.picture;
        },
        removeStatePicture(payload: { state: State, index: number }) {
            payload.state.pictures.splice(payload.index, 1);
        },
        setInapplicableState(payload: { state: State, selected: boolean }) {
            const character = this.dataset.charactersHierarchy.stateCharacter(payload.state);
            if (typeof character === "undefined") return;

            setState(character.inapplicableStates, payload.state, payload.selected);
            this.dataset.charactersHierarchy.add(clone(character));
        },
        setRequiredState(payload: { state: State, selected: boolean }) {
            const character = this.dataset.charactersHierarchy.stateCharacter(payload.state);
            if (typeof character === "undefined") return;

            setState(character.requiredStates, payload.state, payload.selected);
            this.dataset.charactersHierarchy.add(clone(character));
        },
        setInherentState(payload: { state: State }) {
            const character = this.dataset.charactersHierarchy.stateCharacter(payload.state);
            if (typeof character === "undefined") return;

            character.inherentState = payload.state;

            setState(character.requiredStates, payload.state, false);
            setState(character.inapplicableStates, payload.state, false);
        },
        setTaxonState(p: { taxon: Taxon, state: State, has: boolean }) {
            if (p.has) {
                this.dataset.statesByTaxons.add(p.taxon.id, p.state.id);
            } else {
                this.dataset.statesByTaxons.remove(p.taxon.id, p.state.id);
            }
        },
        setStatesByTaxons(statesByTaxons: ManyToManyBimap) {
            this.dataset.statesByTaxons = statesByTaxons;
        },
        addDictionaryEntry(entry: DictionaryEntry) {
            Vue.set(this.dataset.dictionaryEntries, entry.id, entry);
        },
        addDictionaryEntries(entries: Array<DictionaryEntry>) {
            entries.forEach(e => Vue.set(this.dataset.dictionaryEntries, e.id, e));
        },
        addExtraField({ detail }: { detail: string }) {
            this.dataset.extraFields.push({ id: detail, std: false, label: detail, icon: "" });
        },
        removeExtraField(id: string) {
            const i = this.dataset.extraFields.findIndex(f => f.id === id);
            if (i >= 0) {
                this.dataset.extraFields.splice(i, 1);
            }
        },
        resetData() {
            this.dataset.taxonsHierarchy.clear();
            this.dataset.charactersHierarchy.clear();
            this.dataset.statesByTaxons.clear();
        },
    };
}