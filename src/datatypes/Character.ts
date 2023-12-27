import { Character, CharacterPreset, DiscreteCharacter, State } from "./types";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { createHierarchicalItem } from "./HierarchicalItem";
import Months from "./Months";
import { createState } from "./State";
import { generateId } from "@/tools/generateid";

type CharacterInit = Omit<HierarchicalItemInit, "type"> & {
	statesById?: Map<string, State>,
	color?: string,
	inherentState?: State,
	states?: State[],
	preset?: CharacterPreset,
	inapplicableStates?: State[],
	requiredStates?: State[],
	detail?: string,
}

function defaultStates(init: CharacterInit): State[] {
	const statesById = init.statesById;
	if (init.preset === "flowering" && statesById) {
		return Months.NAMES.map(name => {
			const state = createState({
				id: generateId("s", statesById, { id: "" }), name: { S: name, FR: name, EN: name },
			});
			statesById.set(state.id, state);
			return state;
		});
	}
	return [];
}

export function createCharacter(init: CharacterInit): DiscreteCharacter {
	let states = init.states;
	if (!states || states.length === 0) {
		states = defaultStates(init);
	}
	return {
		...createHierarchicalItem({ ...init, type: "character" as const }),
		type: "character",
		characterType: "discrete",
		states,
		color: init.color ?? "#84bf3d",
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

export function characterStates(character: Character | undefined): State[] {
    return character?.characterType === "discrete" ? character.states : [];
}