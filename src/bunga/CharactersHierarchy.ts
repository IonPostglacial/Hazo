import { Character, State } from "./datatypes";
import { Hierarchy, IMap } from "./hierarchy";


export class CharactersHierarchy extends Hierarchy<Character> {
    #stateAdditionCallbacks: Set<(s: State)=>void>;
    #stateRemovalCallbacks: Set<(s: State)=>void>;

    constructor(idPrefix: string, items: IMap<Character>, itemsOrder: string[]|undefined = undefined) {
        super(idPrefix, items, itemsOrder);
        this.#stateAdditionCallbacks = new Set();
        this.#stateRemovalCallbacks = new Set();
    }

    onStateAdded(callback: (s: State) => void) {
        this.#stateAdditionCallbacks.add(callback);
    }

    onStateRemoved(callback: (s: State) => void) {
        this.#stateRemovalCallbacks.add(callback);
    }

    add(character: Character): Character {
        if (character.id === "") {
            const newCharacter = super.add(character);
            const parentDescription = this.itemWithId(character.parentId);
            if(typeof character.parentId !== "undefined" && typeof parentDescription !== "undefined") {
                console.log("add character inherent state", character.name);
                const newState: State = {
                    id: "s-auto-" + newCharacter.id,
                    descriptorId: character.parentId, name: newCharacter.name, nameEN: "", nameCN: "", photos: []
                };
                this.addState(newState);
                newCharacter.inherentState = newState;
            }
            return newCharacter;
        } else {
            return super.add(character);
        }
    }

    addState(state: State) {
        const character = this.itemWithId(state.descriptorId);
        character?.states.push(state);
        for (const callback of this.#stateAdditionCallbacks) {
            callback(state);
        }
    }

    removeState(state: State) {
        const character = this.itemWithId(state.descriptorId);

        if (typeof character === "undefined") return;

        function removeStateFromArray(array: State[], state: State) {
            const index = array.findIndex(s => s.id === state.id);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }

        removeStateFromArray(character.states, state);
        removeStateFromArray(character.inapplicableStates, state);
        removeStateFromArray(character.requiredStates, state);
        if (character.inherentState?.id === state.id) {
            character.inherentState = undefined;
        }
        for (const callback of this.#stateRemovalCallbacks) {
            callback(state);
        }
    }

    protected cloneNewItem(item: Character): Character {
        const newItem = super.cloneNewItem(item);
        newItem.states = [];
        newItem.requiredStates = [];
        newItem.inapplicableStates = [];
        newItem.inherentState = undefined;
        return newItem;
    }
}