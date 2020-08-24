import type { sdd_MediaObject, sdd_Character, sdd_State } from "../libs/SDD";
import { DetailData } from "./DetailData";
import { Field } from "./Field";
import { State } from "./State";
import { HierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";

interface SddCharacterData {
	character: sdd_Character;
	states:Array<sdd_State>;
	mediaObjects:Array<sdd_MediaObject>;
}

interface CharacterCreationData {
	name: string;
	parentId: string;
	states: State[];
	inapplicableStates: State[];
}

interface CharacterInit extends HierarchicalItemInit { states: State[], inapplicableStates: State[] }

export class Character extends HierarchicalItem {
	states: State[];
	inapplicableStates: State[];

	constructor(init : CharacterInit) {
		super(init);
		this.states = init.states ?? [];
		this.inapplicableStates = init.inapplicableStates ?? [];
	}

	static fromSdd(character: sdd_Character, photosByRef: Record<string, string>, statesById: Record<string, State>): Character {
		return new Character({
			type: "character",
			parentId: character.parentId,
			childrenIds: character.childrenIds,
			states: character.states?.map(s => statesById[s.id]),
			inapplicableStates: character.inapplicableStatesRefs?.map(s => statesById[s.ref]),
			...DetailData.fromRepresentation(character.id, character, [], photosByRef),
		});
	}

	static toSdd(character: Character, extraFields: Field[], mediaObjects: sdd_MediaObject[]): SddCharacterData {
		const statesData = character.states.map(s => State.toSdd(s));
		const states = statesData.map(data => data.state);
		return {
			character: {
				id: character.id,
				parentId: character.parentId,
				states: states,
				inapplicableStatesRefs: character.inapplicableStates.map(s => ({ ref: s.id })),
				childrenIds: character.childrenIds.slice(),
				...character.toRepresentation(extraFields),
			},
			states: states,
			mediaObjects: statesData.flatMap(data => data.mediaObjects).concat([]),
		};
	}

	public static create(characters: Record<string, Character>, data:CharacterCreationData):Character {
		let nextId = Object.keys(characters).length;
		while (characters["myd-" + nextId] != null) {
			nextId++;
		}
		const newCharacterId = "myd-" + nextId;
		return new Character({
			type: "character",
			id: newCharacterId,
			parentId: data.parentId,
			childrenIds: [],
			name: data.name,
			states: data.states,
			inapplicableStates: data.inapplicableStates,
		});
	}
}
