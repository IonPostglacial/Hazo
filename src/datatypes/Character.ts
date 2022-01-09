import { Character, CharacterPreset, State } from "./types";
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

export function createCharacter(init: CharacterInit): Character {
	return {
		...createHierarchicalItem({ type: "character", ...init }),
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
