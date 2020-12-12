import { State } from "./datatypes";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { HierarchicalItem } from "./HierarchicalItem";

type CharacterInit = Omit<HierarchicalItemInit, "type"> & { inherentState?: State, inapplicableStates?: State[], requiredStates?: State[] }

export class Character extends HierarchicalItem<Character> {
	inherentState?: State;
	inapplicableStates: State[];
	requiredStates: State[];

	constructor(init: CharacterInit) {
		super({ type: "character", ...init });
		this.inherentState = init.inherentState;
		this.inapplicableStates = init.inapplicableStates ?? [];
		this.requiredStates = init.requiredStates ?? [];
	}
}
