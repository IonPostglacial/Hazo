import { Character, DictionaryEntry, Field, Picture, Hierarchy, standardBooks, Taxon, cloneHierarchy, createTaxon, createCharacter } from "./datatypes";
import { Dataset } from './datatypes/Dataset';
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

export function createStore() {
    const undoStack: (()=>void)[] = [];
    const actions = {
        setConnectedToHub(connectedToHub: boolean) {
            store.connectedToHub = connectedToHub;
        },
        selectTaxon(taxon: Taxon) {
            store.selectedTaxon = taxon.id;
        },
        selectCharacter(character: Character) {
            store.selectedCharacter = character.id;
        },
        copyTaxon(taxon: Taxon) {
            store.copiedTaxon = cloneHierarchy(taxon);
        },
        pasteTaxon(targetId: string) {
            if (store.copiedTaxon !== null) {
                const taxon = cloneHierarchy(store.copiedTaxon);
                taxon.parentId = targetId;
                fixParentIds(taxon);
                store.dataset.addTaxon(taxon);
            }
        },
        addTaxon(taxon: Taxon) {
            store.dataset.addTaxon(taxon);
            undoStack.push(() => store.dataset.removeTaxon(taxon.id));
        },
        setTaxon({taxon, props} : {taxon: Taxon, props: Partial<Taxon>}) {
            store.dataset.setTaxon(taxon.id, props);
        },
        addTaxons(taxons: Taxon[]) {
            taxons.forEach(t => store.dataset.addTaxon(t));
            undoStack.push(() => taxons.forEach(t => store.dataset.removeTaxon(t.id)));
        },
        removeTaxon(taxon: Taxon) {
            store.dataset.removeTaxon(taxon.id);
            undoStack.push(() => store.dataset.addTaxon(taxon));
        },
        changeTaxonParent(e: { taxon: Taxon, newParentId: string }) {
            store.dataset.changeTaxonParent(e.taxon.id, e.newParentId);
        },
        addTaxonPicture(payload: { taxon: Taxon, picture: Picture }) {
            const t = store.dataset.taxon(payload.taxon.id);
            if (t) t.pictures = [...t.pictures, payload.picture];
        },
        setTaxonPicture(payload: { taxon: Taxon, picture: Picture, index: number }) {
            const t = store.dataset.taxon(payload.taxon.id);
            if (t) {
                t.pictures[payload.index] = payload.picture;
                t.pictures = [...t.pictures];
            }
        },
        setTaxonLocations(payload: { taxon: Taxon, positions: { lat: number, lng: number }[] }) {
            const t = store.dataset.taxon(payload.taxon.id);
            if (t) t.specimenLocations = payload.positions;
        },
        removeTaxonPicture(payload: { taxon: Taxon, index: number }) {
            const t = store.dataset.taxon(payload.taxon.id);
            if (t) t.pictures.splice(payload.index, 1);
        },
        copyCharacter(character: Character) {
            const clonedCharacter = cloneHierarchy(character);
            clonedCharacter.requiredStates = clone(clonedCharacter.requiredStates);
            clonedCharacter.inapplicableStates = clone(clonedCharacter.inapplicableStates);
            if (clonedCharacter.characterType === "discrete") {
                clonedCharacter.states = clone(clonedCharacter.states);
                clonedCharacter.inherentState = clone(clonedCharacter.inherentState);
            }
            store.copiedCharacter = clonedCharacter;
        },
        pasteCharacter(targetId: string) {
            if (store.copiedCharacter === null) return;
            const character = cloneHierarchy(store.copiedCharacter);
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
                    store.dataset.addState(newState, character);
                    if (oldRequiredStatesIds.includes(oldState.id)) {
                        character.requiredStates.push(newState);
                    }
                    if (oldInapplicableStatesIds.includes(oldState.id)) {
                        character.inapplicableStates.push(newState);
                    }
                }
            }
            const newParent = store.dataset.character(targetId);
            if (newParent?.characterType === "discrete" && store.copiedCharacter?.characterType === "discrete") {
                if (newParent && store.copiedCharacter?.inherentState?.id) {
                    store.copiedCharacter.inherentState.id = "s-auto-" + store.copiedCharacter.id;
                    newParent.states.push(store.copiedCharacter.inherentState);
                }
            }
            character.parentId = targetId;
            fixParentIds(character);
            store.dataset.addCharacter(character);
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
                const character = store.dataset.character(characterId);
                if (typeof character !== "undefined" && character.characterType === "discrete") {
                    store.dataset.addState(stateToAdd, character);
                }
            }
        },
        addCharacter(character: Character) {
            store.dataset.addCharacter(character);
            undoStack.push(() => store.dataset.removeCharacter(character.id));
        },
        setCharacter({character, props} : {character: Character, props: Partial<Character>}) {
            store.dataset.setCharacter(character.id, props);
        },
        addCharacters(characters: Character[]) {
            characters.forEach(c => store.dataset.addCharacter(c));
            undoStack.push(() => characters.forEach(c => store.dataset.removeCharacter(c.id)));
        },
        removeCharacter(character: Character) {
            store.dataset.removeCharacter(character.id);
            undoStack.push(() => store.dataset.addCharacter(character));
        },
        addCharacterPicture(payload: { character: Character, picture: Picture }) {
            const c = store.dataset.character(payload.character.id);
            if (c) c.pictures = [...c.pictures, payload.picture];
        },
        setCharacterPicture(payload: { character: Character, picture: Picture, index: number }) {
            const c = store.dataset.character(payload.character.id);
            if (c) {
                c.pictures[payload.index] = payload.picture;
                c.pictures = [...c.pictures];
            }
        },
        removeCharacterPicture(payload: { character: Character, index: number }) {
            const c = store.dataset.character(payload.character.id);
            if (c) c.pictures.splice(payload.index, 1);
        },
        setDataset(dataset: Dataset) {
            Object.assign(store.dataset, dataset);
        },
        addState(payload: { state: State, character: DiscreteCharacter }) {
            store.dataset.addState(payload.state, payload.character);
        },
        moveTaxonUp(taxon: Taxon) {
            store.dataset.moveTaxonUp(taxon);
        },
        moveTaxonDown(taxon: Taxon) {
            store.dataset.moveTaxonDown(taxon);
        },
        moveCharacterUp(character: Character) {
            store.dataset.moveCharacterUp(character);
        },
        moveCharacterDown(character: Character) {
            store.dataset.moveCharacterDown(character);
        },
        moveStateUp(payload: { state: State, character: DiscreteCharacter }) {
            const c = store.dataset.character(payload.character.id);
            const index = payload.character.states.findIndex(s => s.id === payload.state.id);
            if (index > 0 && c?.characterType === "discrete") {
                c.states[index] = c.states[index-1];
                c.states[index-1] = payload.state;
                c.states = [...c.states];
            }
        },
        moveStateDown(payload: { state: State, character: DiscreteCharacter }) {
            const c = store.dataset.character(payload.character.id);
            const index = payload.character.states.findIndex(s => s.id === payload.state.id);
            if (index < payload.character.states.length - 1 && c?.characterType === "discrete") {
                c.states[index] = c.states[index+1];
                c.states[index+1] = payload.state;
                c.states = [...c.states];
            }
        },
        removeState(payload: { state: State, character: DiscreteCharacter }) {
            store.dataset.removeState(payload.state, payload.character);
        },
        addStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, picture: Picture }) {
            const c = store.dataset.character(payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c.states.find(s => s.id === payload.state.id);
                if (s) s.pictures = [...s.pictures, payload.picture];
            }
        },
        setStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, picture: Picture, index: number }) {
            const c = store.dataset.character(payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c?.states.find(s => s.id === payload.state.id);
                if (s) {
                    s.pictures[payload.index] = payload.picture;
                    s.pictures = [...s.pictures];
                }
            }
        },
        removeStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, index: number }) {
            const c = store.dataset.character(payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c?.states.find(s => s.id === payload.state.id);
                if (s) s.pictures.splice(payload.index, 1);
            }
        },
        setInapplicableState(payload: { character: DiscreteCharacter, state: State, selected: boolean }) {
            setState(payload.character.inapplicableStates, payload.state, payload.selected);
            store.dataset.addCharacter(clone(payload.character));
        },
        setRequiredState(payload: { character: DiscreteCharacter, state: State, selected: boolean }) {
            setState(payload.character.requiredStates, payload.state, payload.selected);
            store.dataset.addCharacter(clone(payload.character));
        },
        setInherentState(payload: { character: DiscreteCharacter, state: State }) {
            const ch = store.dataset.character(payload.character.id);
            if (ch?.characterType === "discrete") {
                ch.inherentState = payload.state;
                setState(ch.requiredStates, payload.state, false);
                setState(ch.inapplicableStates, payload.state, false);
            }
        },
        setTaxonState(p: { taxon: Taxon, state: State, has: boolean }) {
            if (p.has) {
                store.dataset.setTaxonState(p.taxon.id, p.state);
            } else {
                store.dataset.removeTaxonState(p.taxon.id, p.state);
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
        addStateToAllowList(state: State) {
            store.statesAllowList = [...store.statesAllowList, state];
        },
        removeStateFromAllowList(state: State) {
            store.statesAllowList = store.statesAllowList.filter(s => s.id !== state.id);
        },
        addStateToDenyList(state: State) {
            store.statesDenyList = [...store.statesDenyList, state];
        },
        removeStateFromDenyList(state: State) {
            store.statesDenyList = store.statesDenyList.filter(s => s.id !== state.id);
        },
    };
    function perform<Action extends keyof typeof actions>(action: Action, ...params: Parameters<typeof actions[Action]>) {
        if (store.dbg) {
            console.log("Store: '" + action + "' " + params.map(p => JSON.stringify(p)).join(" "));
        }
        (actions[action] as any).apply(self, params);
    }
    const store = reactive({
        dbg: false,
        dataset: new Dataset("",
            createTaxon({ id: "t0", name: { S: "<TOP>" } }),
            createCharacter({ id: "c0", name: { S: "<TOP>" } }),
            standardBooks,
            new Array<Field>(),
            new Map(),
        ),
        selectedTaxon: "",
        selectedCharacter: "",
        dictionary: { entries: new Array<DictionaryEntry>() },
        connectedToHub: false,
        copiedTaxon: null as null | Hierarchy<Taxon>,
        copiedCharacter: null as null | Hierarchy<Character>,
        copiedStates: [] as State[],
        statesAllowList: [] as State[],
        statesDenyList: [] as State[],
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
    });
    return store;
}