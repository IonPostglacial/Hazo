import { Character, State } from "./datatypes";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { createHierarchicalItem } from "./HierarchicalItem";

type CharacterInit = Omit<HierarchicalItemInit, "type"> & { states: State[], inherentState?: State, inapplicableStates?: State[], requiredStates?: State[] }

export function createCharacter(init: CharacterInit): Character {
	return Object.assign({ states: init.states, inherentState: init.inherentState, inapplicableStates: init.inapplicableStates ?? [], requiredStates: init.requiredStates ?? [] },
		createHierarchicalItem<Character>({ type: "character", ...init }));
}
