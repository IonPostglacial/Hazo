import { Character, CharacterPreset, DiscreteCharacter, State } from "./types";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { createHierarchicalItem } from "./HierarchicalItem";
import Months from "./Months";
import { createState } from "./State";

type CharacterInit = Omit<HierarchicalItemInit, "type"> & {
	inherentState?: State,
	states?: State[],
	preset?: CharacterPreset,
	inapplicableStates?: State[],
	requiredStates?: State[],
	detail?: string,
}

function defaultStates(init: CharacterInit): State[] {
	if (init.preset === "flowering") {
		return Months.NAMES.map(name => createState({
			name: { S: name, FR: name, EN: name },
		}));
	}
	return [];
}

export function createCharacter(init: CharacterInit): DiscreteCharacter {
	return {
		...createHierarchicalItem(init),
		type: "character",
		characterType: "discrete",
		states: init.states ?? defaultStates(init),
		inherentState: init.inherentState,
		inapplicableStates: init.inapplicableStates ?? [],
		requiredStates: init.requiredStates ?? [],
		preset: init.preset,
		detail: init.detail ?? "",
		children: [],
	};
}

export function characterHasState(ch: Character, state: { id: string }|undefined): boolean {
	return typeof state !== "undefined" && ch?.characterType === "discrete" &&
		(ch?.states.some(s => s.id === state.id) ?? false);
}
