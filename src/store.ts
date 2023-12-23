import { defineStore } from "pinia";
import { Character, DictionaryEntry, Field, Picture, Hierarchy, standardBooks, Taxon, cloneHierarchy, createTaxon, createCharacter, addTaxon } from "./datatypes";
import { Dataset, moveCharacterDown, moveCharacterUp, taxonFromId, characterFromId, setTaxon, removeTaxon, changeTaxonParent, addCharacter, setCharacter, removeCharacter, setTaxonState, removeTaxonState, addState, removeAllCharacterStates, removeState, createDataset } from './datatypes';
import { DiscreteCharacter, State } from "./datatypes/types";
import clone from "./tools/clone";
import makeid from './tools/makeid';
import { addDictionaryEntry, deleteDictionaryEntry } from "./db-storage";
import { fixParentIds } from "./tools/fixes";
import { reactive } from "vue";

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

export const useHazoStore = defineStore('hazo', {
    state: () => ({
        selectedTaxon: "",
        selectedCharacter: "",
        dictionary: { entries: new Array<DictionaryEntry>() },
        connectedToHub: false,
        copiedTaxon: null as null | Hierarchy<Taxon>,
        copiedCharacter: null as null | Hierarchy<Character>,
        copiedStates: [] as State[],
        statesAllowList: [] as State[],
        statesDenyList: [] as State[],
    }),
    actions: {
        addStateToAllowList(state: State) {
            this.statesAllowList = [...this.statesAllowList, state];
        },
        removeStateFromAllowList(state: State) {
            this.statesAllowList = this.statesAllowList.filter(s => s.id !== state.id);
        },
        addStateToDenyList(state: State) {
            this.statesDenyList = [...this.statesDenyList, state];
        },
        removeStateFromDenyList(state: State) {
            this.statesDenyList = this.statesDenyList.filter(s => s.id !== state.id);
        },
        setConnectedToHub(connectedToHub: boolean) {
            this.connectedToHub = connectedToHub;
        },
        selectTaxon(taxon: Taxon) {
            this.selectedTaxon = taxon.id;
        },
        selectCharacter(character: Character) {
            this.selectedCharacter = character.id;
        },
        copyTaxon(taxon: Taxon) {
            this.copiedTaxon = cloneHierarchy(taxon);
        },
        copyCharacter(character: Character) {
            const clonedCharacter = cloneHierarchy(character);
            clonedCharacter.requiredStates = clone(clonedCharacter.requiredStates);
            clonedCharacter.inapplicableStates = clone(clonedCharacter.inapplicableStates);
            if (clonedCharacter.characterType === "discrete") {
                clonedCharacter.states = clone(clonedCharacter.states);
                clonedCharacter.inherentState = clone(clonedCharacter.inherentState);
            }
            this.copiedCharacter = clonedCharacter;
        },
        copyStates(states: State[] | undefined) {
            if (typeof states !== "undefined") {
                this.copiedStates = clone(states);
                this.copiedStates.forEach(s => s.id = "s-" + makeid(8));
            }
        },
    }
});

export function createStore() {
    const hazoStore = useHazoStore();
    const undoStack: (()=>void)[] = [];
    const actions = {
        pasteTaxon(targetId: string) {
            if (hazoStore.copiedTaxon !== null) {
                const taxon = cloneHierarchy(hazoStore.copiedTaxon);
                taxon.parentId = targetId;
                fixParentIds(taxon);
                this.addTaxon(taxon);
            }
        },
        pasteCharacter(targetId: string) {
            if (hazoStore.copiedCharacter === null) return;
            const character = cloneHierarchy(hazoStore.copiedCharacter);
            const oldRequiredStatesIds = character.requiredStates.map(s => s.id);
            const oldInapplicableStatesIds = character.inapplicableStates.map(s => s.id);
            character.requiredStates = [];
            character.inapplicableStates = [];
            if (character.characterType === "discrete") {
                const oldStates = character.states;
                character.states = [];
                for (const oldState of oldStates) {
                    const newState = clone(oldState);
                    newState.id = "";
                    this.addState({ state: newState, character });
                    if (oldRequiredStatesIds.includes(oldState.id)) {
                        character.requiredStates.push(newState);
                    }
                    if (oldInapplicableStatesIds.includes(oldState.id)) {
                        character.inapplicableStates.push(newState);
                    }
                }
            }
            const newParent = characterFromId(store.dataset, targetId);
            if (newParent?.characterType === "discrete" && hazoStore.copiedCharacter?.characterType === "discrete") {
                if (newParent && hazoStore.copiedCharacter?.inherentState?.id) {
                    hazoStore.copiedCharacter.inherentState.id = "s-auto-" + hazoStore.copiedCharacter.id;
                    newParent.states.push(hazoStore.copiedCharacter.inherentState);
                }
            }
            character.parentId = targetId;
            fixParentIds(character);
            this.addCharacter(character);
        },
        pasteStates(characterId: string) {
            for (const s of hazoStore.copiedStates) {
                const stateToAdd = clone(s);
                const character = characterFromId(store.dataset, characterId);
                if (typeof character !== "undefined" && character.characterType === "discrete") {
                    this.addState({ state: stateToAdd, character });
                }
            }
        },
        addTaxon(taxon: Taxon) {
            addTaxon(store.dataset, taxon);
            undoStack.push(() => this.removeTaxon(taxon));
        },
        setTaxon({taxon, props} : {taxon: Taxon, props: Partial<Taxon>}) {
            setTaxon(store.dataset, taxon.id, props);
        },
        addTaxons(taxons: Taxon[]) {
            taxons.forEach(t => this.addTaxon(t));
            undoStack.push(() => taxons.forEach(t => this.removeTaxon(t)));
        },
        removeTaxon(taxon: Taxon) {
            removeTaxon(store.dataset, taxon.id);
            undoStack.push(() => this.addTaxon(taxon));
        },
        changeTaxonParent(e: { taxon: Taxon, newParentId: string }) {
            changeTaxonParent(store.dataset, e.taxon.id, e.newParentId);
        },
        addTaxonPicture(payload: { taxon: Taxon, picture: Picture }) {
            const t = taxonFromId(store.dataset, payload.taxon.id);
            if (t) t.pictures = [...t.pictures, payload.picture];
        },
        setTaxonPicture(payload: { taxon: Taxon, picture: Picture, index: number }) {
            const t = taxonFromId(store.dataset, payload.taxon.id);
            if (t) {
                t.pictures[payload.index] = payload.picture;
                t.pictures = [...t.pictures];
            }
        },
        setTaxonLocations(payload: { taxon: Taxon, positions: { lat: number, lng: number }[] }) {
            const t = taxonFromId(store.dataset, payload.taxon.id);
            if (t) t.specimenLocations = payload.positions;
        },
        removeTaxonPicture(payload: { taxon: Taxon, index: number }) {
            const t = taxonFromId(store.dataset, payload.taxon.id);
            if (t) t.pictures.splice(payload.index, 1);
        },
        addCharacter(character: Character) {
            addCharacter(store.dataset, character);
            undoStack.push(() => this.removeCharacter(character));
        },
        setCharacter({character, props} : {character: Character, props: Partial<Character>}) {
            setCharacter(store.dataset, character.id, props);
        },
        addCharacters(characters: Character[]) {
            characters.forEach(c => this.addCharacter(c));
            undoStack.push(() => characters.forEach(c => this.removeCharacter(c)));
        },
        removeCharacter(character: Character) {
            removeCharacter(store.dataset, character.id);
            undoStack.push(() => this.addCharacter(character));
        },
        addCharacterPicture(payload: { character: Character, picture: Picture }) {
            const c = characterFromId(store.dataset, payload.character.id);
            if (c) c.pictures = [...c.pictures, payload.picture];
        },
        setCharacterPicture(payload: { character: Character, picture: Picture, index: number }) {
            const c = characterFromId(store.dataset, payload.character.id);
            if (c) {
                c.pictures[payload.index] = payload.picture;
                c.pictures = [...c.pictures];
            }
        },
        removeCharacterPicture(payload: { character: Character, index: number }) {
            const c = characterFromId(store.dataset, payload.character.id);
            if (c) c.pictures.splice(payload.index, 1);
        },
        setDataset(dataset: Dataset) {
            Object.assign(store.dataset, dataset);
        },
        addState(payload: { state: State, character: DiscreteCharacter }) {
            addState(store.dataset, payload.state, payload.character);
        },
        setStates(payload: { states: State[], character: DiscreteCharacter }) {
            const character = characterFromId(store.dataset, payload.character.id);
            if (typeof character === "undefined" || character.characterType !== "discrete") { return; }
            removeAllCharacterStates(store.dataset, character);
            payload.states.forEach(state => {
                this.addState({ state, character });
            });
        },
        moveTaxonUp(taxon: Taxon) {
            moveCharacterUp(store.dataset.taxonsHierarchy, store.dataset.taxonsByIds, taxon);
        },
        moveTaxonDown(taxon: Taxon) {
            moveCharacterDown(store.dataset.taxonsHierarchy, store.dataset.taxonsByIds, taxon);
        },
        moveCharacterUp(character: Character) {
            moveCharacterUp(store.dataset.charactersHierarchy, store.dataset.charactersByIds, character);
        },
        moveCharacterDown(character: Character) {
            moveCharacterDown(store.dataset.charactersHierarchy, store.dataset.charactersByIds, character);
        },
        moveStateUp(payload: { state: State, character: DiscreteCharacter }) {
            const c = characterFromId(store.dataset, payload.character.id);
            const index = payload.character.states.findIndex(s => s.id === payload.state.id);
            if (index > 0 && c?.characterType === "discrete") {
                c.states[index] = c.states[index-1];
                c.states[index-1] = payload.state;
                c.states = [...c.states];
            }
        },
        moveStateDown(payload: { state: State, character: DiscreteCharacter }) {
            const c = characterFromId(store.dataset, payload.character.id);
            const index = payload.character.states.findIndex(s => s.id === payload.state.id);
            if (index < payload.character.states.length - 1 && c?.characterType === "discrete") {
                c.states[index] = c.states[index+1];
                c.states[index+1] = payload.state;
                c.states = [...c.states];
            }
        },
        removeState(payload: { state: State, character: DiscreteCharacter }) {
            removeState(store.dataset, payload.state, payload.character);
        },
        removeStates(payload: { states: State[], character: DiscreteCharacter }) {
            payload.states.forEach(state => {
                this.removeState({ state, character: payload.character });
            })
        },
        addStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, picture: Picture }) {
            const c = characterFromId(store.dataset, payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c.states.find(s => s.id === payload.state.id);
                if (s) s.pictures = [...s.pictures, payload.picture];
            }
        },
        setStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, picture: Picture, index: number }) {
            const c = characterFromId(store.dataset, payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c?.states.find(s => s.id === payload.state.id);
                if (s) {
                    s.pictures[payload.index] = payload.picture;
                    s.pictures = [...s.pictures];
                }
            }
        },
        removeStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, index: number }) {
            const c = characterFromId(store.dataset, payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c?.states.find(s => s.id === payload.state.id);
                if (s) s.pictures.splice(payload.index, 1);
            }
        },
        setInapplicableState(payload: { character: DiscreteCharacter, state: State, selected: boolean }) {
            setState(payload.character.inapplicableStates, payload.state, payload.selected);
            this.addCharacter(clone(payload.character));
        },
        setRequiredState(payload: { character: DiscreteCharacter, state: State, selected: boolean }) {
            setState(payload.character.requiredStates, payload.state, payload.selected);
            this.addCharacter(clone(payload.character));
        },
        setInherentState(payload: { character: DiscreteCharacter, state: State }) {
            const ch = characterFromId(store.dataset, payload.character.id);
            if (ch?.characterType === "discrete") {
                ch.inherentState = payload.state;
                setState(ch.requiredStates, payload.state, false);
                setState(ch.inapplicableStates, payload.state, false);
            }
        },
        setTaxonState(p: { taxon: Taxon, state: State, has: boolean }) {
            if (p.has) {
                setTaxonState(store.dataset, p.taxon.id, p.state);
            } else {
                removeTaxonState(store.dataset, p.taxon.id, p.state);
            }
        },
        addDictionaryEntry(entry: DictionaryEntry) {
            addDictionaryEntry(entry);
            store.dictionary.entries = [...store.dictionary.entries, entry];
        },
        removeDictionaryEntryAt(index: number) {
            deleteDictionaryEntry(store.dictionary.entries[index].id);
            store.dictionary.entries.splice(index, 1);
            store.dictionary.entries = Array.from(store.dictionary.entries);
        },
        addDictionaryEntries(entries: Array<DictionaryEntry>) {
            entries.forEach(addDictionaryEntry);
            store.dictionary.entries = [...store.dictionary.entries, ...entries];
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
            store.dataset.taxonsHierarchy = createTaxon({ id: "t0", name: { S: "<TOP>" } });
            store.dataset.charactersHierarchy = createCharacter({ id: "c0", name: { S: "<TOP>" } });
        },
    };
    function perform<Action extends keyof typeof actions>(action: Action, ...params: Parameters<typeof actions[Action]>) {
        if (store.dbg) {
            console.log("Store: '" + action + "' " + params.map(p => JSON.stringify(p)).join(" "));
        }
        (actions[action] as any).apply(self, params);
    }
    const storeData = {
        dbg: false,
        dataset: createDataset({ 
            id: "",
            taxonsHierarchy: createTaxon({ id: "t0", name: { S: "<TOP>" } }),
            charactersHierarchy: createCharacter({ id: "c0", name: { S: "<TOP>" } }),
            books: standardBooks,
            extraFields: new Array<Field>(),
            statesById: new Map(),
        }),
        dictionary: { entries: new Array<DictionaryEntry>() },
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
    const store = reactive(storeData);
    return store;
}