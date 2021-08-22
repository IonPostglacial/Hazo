import Vue from "vue";

import type { Character, DictionaryEntry, Field, Hierarchy, Picture, State, Taxon } from "@/datatypes";
import { standardBooks } from "@/datatypes/stdcontent";
import { Dataset } from './datatypes/Dataset';
import clone from "./tools/clone";
import makeid from './tools/makeid';
import { ObservableMap } from "./tools/observablemap";
import { createHierarchy, mergeIn, getIn, removeIn } from "./datatypes/hierarchy";
import { FullTaxon, TaxonInit } from "./datatypes/Taxon";
import { CharacterInit, FullCharacter } from "./datatypes/Character";

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
        copyTaxon(item: Hierarchy) {
            const taxon = store.dataset.taxonsProps.get(item.id);
            if (typeof taxon !== "undefined") {
                store.copiedTaxon = { h: clone(item), props: clone(taxon) };
            }
        },
        pasteTaxon(targetPath: number[]) {
            if (store.copiedTaxon !== null) {
                store.dataset.addTaxon({ h: store.copiedTaxon.h, props: store.copiedTaxon.props, at: targetPath });
            }
        },
        addTaxonHierarchy(taxonHierarchy: Hierarchy) {
            mergeIn(store.dataset.taxonsHierarchy, store.dataset.taxonsProps, [], taxonHierarchy);
        },
        addTaxon(taxon: TaxonInit) {
            store.dataset.addTaxon(taxon);
            undoStack.push(() => store.dataset.removeTaxon(taxon.at));
        },
        addTaxons(taxons: TaxonInit[]) {
            taxons.forEach(t => store.dataset.addTaxon(t));
            undoStack.push(() => taxons.forEach(t => store.dataset.removeTaxon(t.at)));
        },
        removeTaxon(path: number[]) {
            const h = getIn(store.dataset.taxonsHierarchy, path);
            const props = store.dataset.taxonsProps.get(h?.id ?? "");
            if (h && props) {
                store.dataset.removeTaxon(path);
                undoStack.push(() => store.dataset.addTaxon({ h, props, at: path }));
            }
        },
        changeTaxonParent(e: { oldPath: number[], newPath: number[] }) {
            const item = removeIn(store.dataset.taxonsHierarchy, e.oldPath);
            const parent = getIn(store.dataset.taxonsHierarchy, e.newPath);
            parent?.children.push(item);
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
        copyCharacter(item: Hierarchy) {
            const character = store.dataset.charProps.get(item.id);
            if (typeof character !== "undefined") {
                store.copiedCharacter = { h: clone(item), props: clone(character) };
            }
        },
        pasteCharacter(targetPath: number[]) {
            if (store.copiedCharacter !== null) {
                store.dataset.addCharacter({ h: store.copiedCharacter.h, props: store.copiedCharacter.props, at: targetPath });
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
                store.dataset.addState(stateToAdd, characterId);
            }
        },
        addCharacterHierarchy(characterHierarchy: Hierarchy) {
            mergeIn(store.dataset.charactersHierarchy, store.dataset.charProps, [], characterHierarchy);
        },
        addCharacter(character: CharacterInit) {
            store.dataset.addCharacter(character);
            undoStack.push(() => store.dataset.removeCharacter(character.at));
        },
        addCharacters(characters: CharacterInit[]) {
            characters.forEach(c => store.dataset.addCharacter(c));
            undoStack.push(() => characters.forEach(c => store.dataset.removeCharacter(c.at)));
        },
        removeCharacter(path: number[]) {
            const h = getIn(store.dataset.charactersHierarchy, path);
            const props = store.dataset.charProps.get(h?.id ?? "");
            if (h && props) {
                store.dataset.removeCharacter(path);
                undoStack.push(() => store.dataset.addCharacter({ h, props, at: path }));
            }
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
        addState(payload: { state: State, characterId: string }) {
            store.dataset.addState(payload.state, payload.characterId);
        },
        moveStateUp(payload: { state: State, character: Character }) {
            const index = payload.character.states.findIndex(s => s.id === payload.state.id);
            if (index > 0) {
                payload.character.states[index] = payload.character.states[index-1];
                payload.character.states[index-1] = payload.state;
                payload.character.states = [...payload.character.states];
            }
        },
        moveStateDown(payload: { state: State, character: Character }) {
            const index = payload.character.states.findIndex(s => s.id === payload.state.id);
            if (index < payload.character.states.length - 1) {
                payload.character.states[index] = payload.character.states[index+1];
                payload.character.states[index+1] = payload.state;
                payload.character.states = [...payload.character.states];
            }
        },
        removeState(payload: { state: State, characterPath: number[] }) {
            store.dataset.removeState(payload.state, payload.characterPath);
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
        setInapplicableState(payload: { characterId: string, state: State, selected: boolean }) {
            const character = store.dataset.charProps.get(payload.characterId);
            if (typeof character !== "undefined") {
                setState(character.inapplicableStates, payload.state, payload.selected);
                store.dataset.charProps.set(payload.characterId, clone(character));
            }
        },
        setRequiredState(payload: { characterId: string, state: State, selected: boolean }) {
            const character = store.dataset.charProps.get(payload.characterId);
            if (typeof character !== "undefined") {
                setState(character.requiredStates, payload.state, payload.selected);
                store.dataset.charProps.set(payload.characterId, clone(character));
            }
        },
        setInherentState(payload: { characterId: string, state: State }) {
            const ch = store.dataset.charProps.get(payload.characterId);
            if (typeof ch !== "undefined") {
                ch.inherentState = payload.state;
                setState(ch.requiredStates, payload.state, false);
                setState(ch.inapplicableStates, payload.state, false);
            }
        },
        setTaxonState(p: { taxonId: string, state: State, has: boolean }) {
            if (p.has) {
                store.dataset.setTaxonState(p.taxonId, p.state);
            } else {
                store.dataset.removeTaxonState(p.taxonId, p.state);
            }
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
            store.dataset.taxonsHierarchy = createHierarchy("t", new Set(), { id: "", type: "taxon", name: { S: "TOP" } });
            store.dataset.charactersHierarchy = createHierarchy("c", new Set(), { id: "", type: "character", name: { S: "TOP" } })
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
        dataset: new Dataset("", ObservableMap),
        connectedToHub: false,
        copiedTaxon: null as null | FullTaxon,
        copiedCharacter: null as null | FullCharacter,
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