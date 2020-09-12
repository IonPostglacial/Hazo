import { Character, State } from "./datatypes";
import { HierarchicalItemInit } from "./HierarchicalItem";
import { createHierarchicalItem } from "./HierarchicalItem";

interface CharacterCreationData {
	name: string;
	parentId: string;
	states: State[];
	inapplicableStates: State[];
}

interface CharacterInit extends HierarchicalItemInit { states: State[], inapplicableStates: State[] }

export function createCharacter(init: CharacterInit): Character {
	return Object.assign({ states: init.states ?? [], inapplicableStates: init.inapplicableStates ?? [] },
		createHierarchicalItem<Character>(init));
}

export function addNewCharacter(characters: Record<string, Character>, data: CharacterCreationData): Character {
	let nextId = Object.keys(characters).length;
	while (typeof characters["myd-" + nextId] !== "undefined") {
		nextId++;
	}
	const newCharacterId = "myd-" + nextId;
	return createCharacter({
		type: "character",
		id: newCharacterId,
		parentId: data.parentId,
		childrenIds: [],
		name: data.name,
		states: data.states,
		inapplicableStates: data.inapplicableStates,
	});
}
