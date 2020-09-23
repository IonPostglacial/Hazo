import { Character, State } from "./datatypes";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { createHierarchicalItem } from "./HierarchicalItem";

interface CharacterInit extends HierarchicalItemInit { states: State[], inapplicableStates: State[] }

export function createCharacter(init: CharacterInit): Character {
	return Object.assign({ states: init.states ?? [], inapplicableStates: init.inapplicableStates ?? [] },
		createHierarchicalItem<Character>(init));
}
