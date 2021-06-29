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
    const undoStack: (()=>void)[] = [];
    const actions = {
        setConnectedToHub(connectedToHub: boolean) {
            store.connectedToHub = connectedToHub;
        },
        copyTaxon(taxon: Taxon) {
            store.copiedTaxon = store.dataset.taxonsHierarchy.extractHierarchy(taxon);
        },
        pasteTaxon(targetId: string) {
            if (store.copiedTaxon !== null) {
                store.dataset.taxonsHierarchy.addHierarchy(store.copiedTaxon, targetId);
            }
        },
        addTaxonHierarchy(taxonHierarchy: Hierarchy<Taxon>) {
            store.dataset.taxonsHierarchy.addHierarchy(taxonHierarchy, undefined);
        },
        addTaxon(taxon: Taxon) {
            store.dataset.addTaxon(taxon);
            undoStack.push(() => store.dataset.removeTaxon(taxon));
        },
        addTaxons(taxons: Taxon[]) {
            taxons.forEach(t => store.dataset.addTaxon(t));
            undoStack.push(() => taxons.forEach(t => store.dataset.removeTaxon(t)));
        },
        removeTaxon(taxon: Taxon) {
            store.dataset.removeTaxon(taxon);
            undoStack.push(() => store.dataset.addTaxon(taxon));
        },
        changeTaxonParent(e: { taxon: Taxon, newParentId: string }) {
            store.dataset.changeTaxonParent(e.taxon, e.newParentId);
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
            store.copiedCharacter = store.dataset.charactersHierarchy.extractHierarchy(character);
        },
        pasteCharacter(targetId: string) {
            if (store.copiedCharacter !== null) {
                store.dataset.charactersHierarchy.addHierarchy(store.copiedCharacter, targetId);
            }
        },
        copyStates(states: State[] | undefined) {
            if (typeof states !== "undefined") {
                store.copiedStates = clone(states);
                store.copiedStates.forEach(s => s.id = "s-" + makeid(8));
            }
        },
        pasteStates(characterId: string) {
            for (const s of store.copiedStates) {
                const stateToAdd = clone(s);
                const character = store.dataset.charactersHierarchy.itemWithId(characterId);
                if (typeof character !== "undefined") {
                    store.dataset.charactersHierarchy.addState(stateToAdd, character);
                }
            }
        },
        addCharacterHierarchy(characterHierarchy: Hierarchy<Character>) {
            store.dataset.charactersHierarchy.addHierarchy(characterHierarchy, undefined);
        },
        addCharacter(character: Character) {
            store.dataset.addCharacter(character);
            undoStack.push(() => store.dataset.removeCharacter(character));
        },
        addCharacters(characters: Character[]) {
            characters.forEach(c => store.dataset.addCharacter(c));
            undoStack.push(() => characters.forEach(c => store.dataset.removeCharacter(c)));
        },
        removeCharacter(character: Character) {
            store.dataset.removeCharacter(character);
            undoStack.push(() => store.dataset.addCharacter(character));
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
            Object.assign(store.dataset, dataset);
        },
        addState(payload: { state: State, character: Character }) {
            store.dataset.charactersHierarchy.addState(payload.state, payload.character);
        },
        removeState(hazoState: State) {
            store.dataset.charactersHierarchy.removeState(hazoState);
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
            const character = store.dataset.charactersHierarchy.stateCharacter(payload.state);
            if (typeof character === "undefined") return;

            setState(character.inapplicableStates, payload.state, payload.selected);
            store.dataset.charactersHierarchy.add(clone(character));
        },
        setRequiredState(payload: { state: State, selected: boolean }) {
            const character = store.dataset.charactersHierarchy.stateCharacter(payload.state);
            if (typeof character === "undefined") return;

            setState(character.requiredStates, payload.state, payload.selected);
            store.dataset.charactersHierarchy.add(clone(character));
        },
        setInherentState(payload: { state: State }) {
            const character = store.dataset.charactersHierarchy.stateCharacter(payload.state);
            if (typeof character === "undefined") return;

            character.inherentState = payload.state;

            setState(character.requiredStates, payload.state, false);
            setState(character.inapplicableStates, payload.state, false);
        },
        setTaxonState(p: { taxon: Taxon, state: State, has: boolean }) {
            if (p.has) {
                store.dataset.statesByTaxons.add(p.taxon.id, p.state.id);
            } else {
                store.dataset.statesByTaxons.remove(p.taxon.id, p.state.id);
            }
        },
        setStatesByTaxons(statesByTaxons: ManyToManyBimap) {
            store.dataset.statesByTaxons = statesByTaxons;
        },
        addDictionaryEntry(entry: DictionaryEntry) {
            Vue.set(store.dataset.dictionaryEntries, entry.id, entry);
        },
        addDictionaryEntries(entries: Array<DictionaryEntry>) {
            entries.forEach(e => Vue.set(store.dataset.dictionaryEntries, e.id, e));
        },
        addExtraField({ detail }: { detail: string }) {
            store.dataset.extraFields.push({ id: detail, std: false, label: detail, icon: "" });
        },
        removeExtraField(id: string) {
            const i = store.dataset.extraFields.findIndex(f => f.id === id);
            if (i >= 0) {
                store.dataset.extraFields.splice(i, 1);
            }
        },
        resetData() {
            store.dataset.taxonsHierarchy.clear();
            store.dataset.charactersHierarchy.clear();
            store.dataset.statesByTaxons.clear();
        },
    };
    function perform<Action extends keyof typeof actions>(action: Action, ...params: Parameters<typeof actions[Action]>) {
        if (store.dbg) {
            console.log("Store: '" + action + "' " + params.map(p => JSON.stringify(p)).join(" "));
        }
        (actions[action] as any).apply(self, params);
    }
    const store = {
        dbg: false,
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
        do: perform,
        undo() {
            const action = undoStack.pop();
            if (typeof action !== "undefined") {
                action();
            }
        },
    };
    return store;
}