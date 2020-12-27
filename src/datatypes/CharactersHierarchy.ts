import { State } from "./types";
import { Character } from "./Character";
import { Hierarchy, IMap } from "./hierarchy";
import { OneToManyBimap } from "@/tools/bimaps";

interface Callback {
    (e: { state: State, character: Character }): void;
}

export class CharactersHierarchy extends Hierarchy<Character> {
    private states: IMap<State>;
    private statesByCharacter: OneToManyBimap;
    #stateAdditionCallbacks: Set<Callback>;
    #stateRemovalCallbacks: Set<Callback>;

    constructor(idPrefix: string, characters: IMap<Character>, statesById: IMap<State>, statesByCharacter: OneToManyBimap, charactersOrder: string[]|undefined = undefined) {
        super(idPrefix, characters, charactersOrder);
        this.states = statesById;
        this.statesByCharacter = statesByCharacter;
        this.#stateAdditionCallbacks = new Set();
        this.#stateRemovalCallbacks = new Set();
    }

    onStateAdded(callback: Callback) {
        this.#stateAdditionCallbacks.add(callback);
    }

    onStateRemoved(callback: Callback) {
        this.#stateRemovalCallbacks.add(callback);
    }

    add(character: Character): Character {
        if (character.id === "") {
            const newCharacter = super.add(character);
            const parentCharacter = this.itemWithId(character.parentId);
            if(typeof character.parentId !== "undefined" && typeof parentCharacter !== "undefined") {
                console.log("add character inherent state", character.name);
                const newState: State = {
                    id: "s-auto-" + newCharacter.id,
                    name: newCharacter.name, nameEN: "", nameCN: "", photos: []
                };
                this.addState(newState, parentCharacter);
                newCharacter.inherentState = newState;
            }
            return newCharacter;
        } else {
            return super.add(character);
        }
    }

    addState(state: State, character: Character) {
		this.states.set(state.id, state);
		this.statesByCharacter.add(character.id, state.id);
        for (const callback of this.#stateAdditionCallbacks) {
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
        for (const callback of this.#stateRemovalCallbacks) {
            callback({ state, character });
        }
    }

    characterHasState(character: { id: string }|undefined, state: { id: string }|undefined): boolean {
        return typeof character !== "undefined" &&
            typeof state !== "undefined" &&
            this.statesByCharacter.has(character.id, state.id);
    }

	*characterStates(character: Character|undefined): Iterable<State> {
		if (typeof character === "undefined") return [];
		for (const stateId of this.statesByCharacter.getRightIdsByLeftId(character.id) ?? []) {
			const state = this.states.get(stateId);
			if (typeof state !== "undefined") yield state;
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

    protected cloneNewItem(item: Character): Character {
        const newItem = super.cloneNewItem(item);
        newItem.requiredStates = [];
        newItem.inapplicableStates = [];
        newItem.inherentState = undefined;
        return newItem;
    }

    clear() {
        super.clear();
        this.states.clear();
    }
}
