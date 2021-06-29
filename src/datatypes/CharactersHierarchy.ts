import { Character, CharacterType, State } from "./types";
import { floweringStates } from "./Character";
import { Hierarchy, IMap } from "./hierarchy";
import { OneToManyBimap } from "@/tools/bimaps";
import { generateId } from "@/tools/generateid";

interface Callback {
    (e: { state: State, character: Character }): void;
}

export class CharactersHierarchy extends Hierarchy<Character> {
    public states: IMap<State>;
    public statesByCharacter: OneToManyBimap;
    private stateAdditionCallbacks: Set<Callback>;
    private stateRemovalCallbacks: Set<Callback>;

    constructor(idPrefix: string, characters: IMap<Character>, statesById: IMap<State>|undefined, statesByCharacter: OneToManyBimap|undefined) {
        super(idPrefix, characters);
        this.states = statesById ?? new Map();
        this.statesByCharacter = statesByCharacter ?? new OneToManyBimap(Map);
        this.stateAdditionCallbacks = new Set();
        this.stateRemovalCallbacks = new Set();
        for (const state of floweringStates) {
            this.states.set(state.id, state);
        }
    }

    onStateAdded(callback: Callback) {
        this.stateAdditionCallbacks.add(callback);
    }

    onStateRemoved(callback: Callback) {
        this.stateRemovalCallbacks.add(callback);
    }

    addState(state: State, character: Character) {
        state.id = generateId(this.states, state);
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
}
