import { Character, CharacterPreset, DiscreteCharacter, RangeCharacter, State } from "./types";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { createHierarchicalItem } from "./HierarchicalItem";
import Months from "./Months";
import { createState } from "./State";
import { generateId } from "@/tools/generateid";
import { standardUnits } from "./stdcontent";

type CharacterInit = Omit<HierarchicalItemInit, "type"> & {
	statesById?: Map<string, State>,
	color?: string,
	inherentState?: State,
	states?: State[],
	preset?: CharacterPreset,
	mapFile?: string,
	inapplicableStates?: State[],
	requiredStates?: State[],
	detail?: string,
	unit?: string,
}

function defaultStates(init: CharacterInit): State[] {
	const statesById = init.statesById;
	if (init.preset === "flowering" && statesById) {
		return Months.NAMES.map(name => {
			const state = createState({
				id: generateId("s", statesById, { id: "" }), path: [], name: { S: name, FR: name, EN: name },
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
		color: init.color,
		inherentState: init.inherentState,
		inapplicableStates: init.inapplicableStates ?? [],
		requiredStates: init.requiredStates ?? [],
		preset: init.preset,
		mapFile: init.mapFile ?? "",
		detail: init.detail ?? "",
		children: [],
	};
}

export function createRangeCharacter(init: CharacterInit): RangeCharacter {
	let states: State[] = init.states ?? [];
	return {
		...createHierarchicalItem({ ...init, type: "character" as const }),
		type: "character",
		characterType: "range",
		color: init.color,
		states,
		inapplicableStates: init.inapplicableStates ?? [],
		requiredStates: init.requiredStates ?? [],
		detail: init.detail ?? "",
		children: [],
		unit: (standardUnits as any)[init.unit ?? ""],
	};
}

export function characterHasState(ch: Character, state: { id: string }|undefined): boolean {
	return typeof state !== "undefined" && ch?.characterType === "discrete" &&
		(ch?.states.some(s => s.id === state.id) ?? false);
}

export function characterStates(character: Character | undefined): State[] {
    return character?.characterType === "discrete" ? character.states : [];
}