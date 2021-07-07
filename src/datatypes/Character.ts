import { Character, State } from "./types";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { createHierarchicalItem } from "./HierarchicalItem";

type CharacterInit = Omit<HierarchicalItemInit, "type"> & {
	inherentState?: State,
	states?: State[],
	inapplicableStates?: State[],
	requiredStates?: State[],
	charType?: "std" | "flowering",
	detail?: string,
}

export const floweringStates: State[] = [
	{ id: "s_month_jan", name: { S: "JAN" }, pictures: [], },
	{ id: "s_month_feb", name: { S: "FEB" }, pictures: [], },
	{ id: "s_month_mar", name: { S: "MAR" }, pictures: [], },
	{ id: "s_month_apr", name: { S: "APR" }, pictures: [], },
	{ id: "s_month_may", name: { S: "MAY" }, pictures: [], },
	{ id: "s_month_jun", name: { S: "JUN" }, pictures: [], },
	{ id: "s_month_jul", name: { S: "JUL" }, pictures: [], },
	{ id: "s_month_aug", name: { S: "AUG" }, pictures: [], },
	{ id: "s_month_sep", name: { S: "SEP" }, pictures: [], },
	{ id: "s_month_oct", name: { S: "OCT" }, pictures: [], },
	{ id: "s_month_nov", name: { S: "NOV" }, pictures: [], },
	{ id: "s_month_dec", name: { S: "DEC" }, pictures: [], },
];

export function createCharacter(init: CharacterInit): Character {
	return {
		...createHierarchicalItem({ type: "character", ...init }),
		states: init.states ?? [],
		inherentState: init.inherentState,
		inapplicableStates: init.inapplicableStates ?? [],
		requiredStates: init.requiredStates ?? [],
		charType: init.charType ?? "std",
		detail: init.detail ?? "",
	};
}
