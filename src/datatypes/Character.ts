import { Character, CharacterPreset, DiscreteCharacter, State } from "./types";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { createHierarchicalItem } from "./HierarchicalItem";

type CharacterInit = Omit<HierarchicalItemInit, "type"> & {
	presetStates?: Record<CharacterPreset, State[]>
	inherentState?: State,
	states?: State[] | CharacterPreset,
	inapplicableStates?: State[],
	requiredStates?: State[],
	detail?: string,
}

export function createCharacter(init: CharacterInit): DiscreteCharacter {
	return {
		...createHierarchicalItem(init),
		type: "character",
		characterType: "discrete",
		states: Array.isArray(init.states) ? init.states :
			typeof init.states === "undefined" ? [] :
			init.presetStates?.[init.states] ?? [],
		inherentState: init.inherentState,
		inapplicableStates: init.inapplicableStates ?? [],
		requiredStates: init.requiredStates ?? [],
		preset: Array.isArray(init.states) ? undefined : init.states,
		detail: init.detail ?? "",
		children: [],
	};
}

export function characterHasState(ch: Character, state: { id: string }|undefined): boolean {
	return typeof state !== "undefined" && ch?.characterType === "discrete" &&
		(ch?.states.some(s => s.id === state.id) ?? false);
}
