import { Character, State } from "./datatypes";
import { Hierarchy, IMap } from "./hierarchy";

interface Callback {
    (e: { state: State, character: Character }): void;
}

export class CharactersHierarchy extends Hierarchy<Character> {
    #stateAdditionCallbacks: Set<Callback>;
    #stateRemovalCallbacks: Set<Callback>;

    constructor(idPrefix: string, items: IMap<Character>, itemsOrder: string[]|undefined = undefined) {
        super(idPrefix, items, itemsOrder);
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
        for (const callback of this.#stateAdditionCallbacks) {
            callback({ state, character });
        }
    }

    removeState(state: State, character: Character) {
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

    protected cloneNewItem(item: Character): Character {
        const newItem = super.cloneNewItem(item);
        newItem.requiredStates = [];
        newItem.inapplicableStates = [];
        newItem.inherentState = undefined;
        return newItem;
    }
}