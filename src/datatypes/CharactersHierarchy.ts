import { Character, CharacterType, State } from "./types";
import { floweringStates } from "./Character";
import { Hierarchy, IMap } from "./hierarchy";
import { OneToManyBimap } from "@/tools/bimaps";
import clone from "@/tools/clone";

interface Callback {
    (e: { state: State, character: Character }): void;
}

export class CharactersHierarchy extends Hierarchy<Character> {
    private states: IMap<State>;
    private statesByCharacter: OneToManyBimap;
    private stateAdditionCallbacks: Set<Callback>;
    private stateRemovalCallbacks: Set<Callback>;

    constructor(idPrefix: string, characters: IMap<Character>, statesById: IMap<State>|undefined, statesByCharacter: OneToManyBimap|undefined) {
        super(idPrefix, characters);
        this.states = statesById ?? new Map();
        this.statesByCharacter = statesByCharacter ?? new OneToManyBimap(Map);
        this.stateAdditionCallbacks = new Set();
        this.stateRemovalCallbacks = new Set();
    }

    onStateAdded(callback: Callback) {
        this.stateAdditionCallbacks.add(callback);
    }

    onStateRemoved(callback: Callback) {
        this.stateRemovalCallbacks.add(callback);
    }

    add(character: Character): Character {
        if (character.id === "") {
            const newCharacter = super.add(character);
            const parentCharacter = this.itemWithId(character.parentId);
            if(typeof character.parentId !== "undefined" && typeof parentCharacter !== "undefined") {
                const newState: State = {
                    id: "s-auto-" + newCharacter.id,
                    name: Object.assign({}, newCharacter.name), pictures: []
                };
                this.addState(newState, parentCharacter);
                newCharacter.inherentState = newState;
            }
            return newCharacter;
        } else {
            return super.add(character);
        }
    }

    remove(character: Character): void {
        this.statesByCharacter.removeLeft(character.id);
        super.remove(character);
    }

    addState(state: State, character: Character) {
        if (state.id === "") {
            const stateKeys = Array.from(this.states.keys());
            let i = stateKeys.length;
            do {
                state.id = "s" + i;
                i++;
            } while(stateKeys.includes(state.id));
        }
		this.states.set(state.id, state);
		this.statesByCharacter.add(character.id, state.id);
        for (const callback of this.stateAdditionCallbacks) {
            callback({ state, character });
        }
    }

    removeState(state: State) {
		this.states.delete(state.id);
        const character = this.itemWithId(this.statesByCharacter.getLeftIdByRightId(state.id));
        if (typeof character === "undefined") return;

        function removeStateFromArray(array: State[], state: State) {
            const index = array.findIndex(s => s.id === state.id);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }
        removeStateFromArray(character.inapplicableStates, state);
        removeStateFromArray(character.requiredStates, state);
        if (character.inherentState?.id === state.id) {
            character.inherentState = undefined;
        }
        for (const callback of this.stateRemovalCallbacks) {
            callback({ state, character });
        }
    }

    characterHasState(character: { id: string, charType: CharacterType }|undefined, state: { id: string }|undefined): boolean {
        return typeof character !== "undefined" &&
            typeof state !== "undefined" &&
            (character.charType === "flowering" || this.statesByCharacter.has(character.id, state.id));
    }

	*characterStates(character: Character|undefined): Iterable<State> {
		if (typeof character === "undefined") return [];
        if (character.charType === "flowering") {
            yield* floweringStates;
        } else {
            for (const stateId of this.statesByCharacter.getRightIdsByLeftId(character.id) ?? []) {
                const state = this.states.get(stateId);
                if (typeof state !== "undefined") yield state;
            }
        }
    }

	stateCharacter(state: {id: string}): Character|undefined {
		return this.itemWithId(this.statesByCharacter.getLeftIdByRightId(state.id));
    }

    get allStates(): Iterable<State> {
        return this.states.values();
    }
    
    statesFromIds(stateIds: readonly string[]): State[] {
        return stateIds.map(id => this.states.get(id)!).filter(s => typeof s !== "undefined");
    }

    protected onCloneFrom(hierarchy: CharactersHierarchy, character: Character, clonedCharacter: Character, newParent: Character|undefined) {
        clonedCharacter.requiredStates = [];
        clonedCharacter.inapplicableStates = [];
        clonedCharacter.inherentState = undefined;
        const oldParent = hierarchy.itemWithId(character.parentId);
        const oldStates = hierarchy.characterStates(character);
        const oldRequiredStatesIds = character.requiredStates.map(s => s.id);
        const oldInapplicableStatesIds = character.inapplicableStates.map(s => s.id);
        for (const oldState of oldStates) {
            const newState = clone(oldState);
            newState.id = "";
            this.addState(newState, clonedCharacter);
            if (oldRequiredStatesIds.includes(oldState.id)) {
                clonedCharacter.requiredStates.push(newState);
            }
            if (oldInapplicableStatesIds.includes(oldState.id)) {
                clonedCharacter.inapplicableStates.push(newState);
            }
        }
        if (newParent && character.inherentState?.id) {
            const oldInherentStateIndex = Array.from(hierarchy.characterStates(oldParent)).findIndex(s => s.id === character.inherentState?.id);
            clonedCharacter.inherentState = Array.from(this.characterStates(newParent))[oldInherentStateIndex];
        }
    }

    clear() {
        super.clear();
        this.states.clear();
    }
}
