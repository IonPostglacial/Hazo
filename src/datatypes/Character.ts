import { Character, CharacterPreset, Hierarchy, HierarchyInit, Picture, State } from "./types";

export type CharacterPropsInit = {
	pictures: Picture[],
	presetStates?: Record<CharacterPreset, State[]>
	inherentState?: State,
	states?: State[] | CharacterPreset,
	inapplicableStates?: State[],
	requiredStates?: State[],
	detail?: string,
}

export function createCharacter(init: CharacterPropsInit): Character {
	return {
		pictures: init.pictures ?? [],
		states: Array.isArray(init.states) ? init.states :
			typeof init.states === "undefined" ? [] :
			(init.presetStates ?? { [init.states]: [] })[init.states],
		inherentState: init.inherentState,
		inapplicableStates: init.inapplicableStates ?? [],
		requiredStates: init.requiredStates ?? [],
		preset: Array.isArray(init.states) ? undefined : init.states,
		detail: init.detail ?? "",
	};
}

export type CharacterInit = {
	h: HierarchyInit,
	props: CharacterPropsInit,
	at: number[],
};

export type FullCharacter = {
	h: Hierarchy,
	props: Character,
};