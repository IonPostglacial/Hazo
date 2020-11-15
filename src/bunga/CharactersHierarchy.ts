import { Character, State } from "./datatypes";
import { Hierarchy, IMap } from "./hierarchy";


export class CharactersHierarchy extends Hierarchy<Character> {
    constructor(idPrefix: string, items: IMap<Character>, itemsOrder: string[]|undefined = undefined) {
        super(idPrefix, items, itemsOrder);
    }

    add(character: Character): Character {
        if (character.id === "") {
            const newCharacter = super.add(character);
            const parentDescription = this.itemWithId(character.parentId);
            if(typeof character.parentId !== "undefined" && typeof parentDescription !== "undefined") {
                const newState: State = {
                    id: "s-auto-" + newCharacter.id,
                    descriptorId: character.parentId, name: newCharacter.name, nameEN: "", nameCN: "", photos: []
                };
                parentDescription.states = [...parentDescription.states, newState];
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