import { Book, Character, CharacterPreset, Description, Field, State, Taxon } from "./types";
import { standardBooks } from "./stdcontent";
import { OneToManyBimap } from "@/tools/bimaps";
import { Hierarchy, IMap } from './hierarchy';
import clone from "@/tools/clone";
import { map } from "@/tools/iter";
import { generateId } from "@/tools/generateid";
import Month from "./Months";

interface StateCallback {
    (e: { state: State, character: Character }): void;
}

export class Dataset {
	private stateAdditionCallbacks = new Set<StateCallback>();
    private stateRemovalCallbacks = new Set<StateCallback>();
	private statesById: IMap<State>;
	presetStates: Record<CharacterPreset, State[]> = {
		flowering: Month.floweringStates,
		family: [],
	};

	constructor(
			public id: string,
			public taxonsHierarchy: Hierarchy<Taxon>,
			public charactersHierarchy: Hierarchy<Character>,
			public books: Book[] = standardBooks.slice(),
			public extraFields: Field[] = [],
			statesById: IMap<State>|undefined) {
		this.statesById = statesById ?? new Map();
		for (const character of charactersHierarchy.allItems) {
			character.states.forEach(s => this.indexState(s));
		}
		for (const taxon of taxonsHierarchy.allItems) {
			this.addFamilyPreset(taxon);
		}
		this.charactersHierarchy.onClone(this.onCharacterCloned.bind(this));
	}

	private addFamilyPreset(taxon: Taxon) {
		if (taxon.parentId) return;

		this.presetStates.family.push({
			id: "s-auto-" + taxon.id,
			name: clone(taxon.name),
			pictures: clone(taxon.pictures),
		});
	}

	private indexState(state: State) {
		this.statesById.set(state.id, state);
	}

	taxonWithId(id: string|undefined): Taxon|undefined {
		return this.taxonsHierarchy.itemWithId(id);
	}

	characterWithId(id: string|undefined): Character|undefined {
		return this.charactersHierarchy.itemWithId(id);
	}

	onCharacterCloned(hierarchy: Hierarchy<Character>, character: Character, clonedCharacter: Character, newParent: Character|undefined) {
		clonedCharacter.states = [];
		clonedCharacter.requiredStates = [];
        clonedCharacter.inapplicableStates = [];
        clonedCharacter.inherentState = undefined;
        const oldParent = hierarchy.itemWithId(character.parentId);
        const oldStates = this.characterStates(character);
        const oldRequiredStatesIds = character.requiredStates.map(s => s.id);
        const oldInapplicableStatesIds = character.inapplicableStates.map(s => s.id);
        for (const oldState of oldStates) {
            const newState = clone(oldState);
            newState.id = "";
            this.addState(newState, clonedCharacter);
            if (oldRequiredStatesIds.includes(oldState.id)) {
                clonedCharacter.requiredStates.push(newState);
            }
            if (oldInapplicableStatesIds.includes(oldState.id)) {
                clonedCharacter.inapplicableStates.push(newState);
            }
        }
        if (newParent && character.inherentState?.id) {
            const oldInherentStateIndex = Array.from(this.characterStates(oldParent)).findIndex(s => s.id === character.inherentState?.id);
            clonedCharacter.inherentState = Array.from(this.characterStates(newParent))[oldInherentStateIndex];
        }
	}

	addTaxon(taxon: Taxon) {
		this.taxonsHierarchy.add(taxon);
		this.addFamilyPreset(taxon);
	}

	removeTaxon(taxon: Taxon) {
		this.taxonsHierarchy.remove(taxon);
		if (taxon.parentId) return;

		const index = this.presetStates.family.findIndex(family => family.id === "s-auto-" + taxon.id);

		if (index >= 0) {
			this.removeStateWithoutCharacter(this.presetStates.family[index]);
			this.presetStates.family.splice(index, 1);
		}
	}

	get taxons() {
		return this.taxonsHierarchy.allItems;
	}

	changeTaxonParent(taxon: Taxon, newParentId: string) {
		if (taxon.id === newParentId) return;

		const childrenTree = [...this.taxonsHierarchy.getOrderedChildrenTree(taxon)];

		this.taxonsHierarchy.remove(taxon);
		taxon.parentId = newParentId;
		this.taxonsHierarchy.add(taxon);
		for (const child of childrenTree) {
			this.taxonsHierarchy.add(child);
		}
	}

	addCharacter(character: Character) {
		const autoid = !character.id;
		this.charactersHierarchy.add(character);
		character.states.forEach(s => this.indexState(s));
		if (autoid) {
            const parentCharacter = this.charactersHierarchy.itemWithId(character.parentId);
            if (typeof character.parentId !== "undefined" && typeof parentCharacter !== "undefined") {
                const newState: State = {
                    id: "s-auto-" + character.id,
                    name: Object.assign({}, character.name), pictures: []
                };
                this.addState(newState, parentCharacter);
                character.inherentState = newState;
            }
		}
	}

	removeCharacter(character: Character) {
		character.states.forEach(s => this.statesById.delete(s.id));
		this.charactersHierarchy.remove(character);
	}

	get characters() {
		return this.charactersHierarchy.allItems;
	}

	hasTaxonState(taxon: Taxon, state: State) {
		return this.taxonsHierarchy.itemWithId(taxon.id)?.states.some(s => s.id === state.id);
	}

	setTaxonState(taxon: Taxon, state: State) {
		const s = this.statesById.get(state.id);
		if (typeof s !== "undefined") {
			this.taxonsHierarchy.itemWithId(taxon.id)?.states.push(s);
		}
	}

	removeTaxonState(taxon: Taxon, state: State) {
		const t = this.taxonsHierarchy.itemWithId(taxon.id);
		if (typeof t !== "undefined") {
			const stateIndex = t.states.findIndex(s => s.id === state.id);
			if (stateIndex >= 0) {
				t.states.splice(stateIndex, 1);
			}
		}
	}

	statesFromIds(stateIds: readonly string[] | undefined): State[] {
		return stateIds?.map(id => this.statesById.get(id)).filter(s => typeof s !== "undefined") as State[] ?? [];
	}

	taxonStates(taxon: Taxon|undefined): State[] {
		return this.taxonsHierarchy.itemWithId(taxon?.id)?.states ?? [];
	}

	private isApplicable({character, taxon}: { character: Character, taxon: Taxon|undefined }): boolean {
		if (typeof taxon === "undefined") return false;

		const taxonHasAllRequiredStates = character.requiredStates.every((requiredState: State) => this.hasTaxonState(taxon, requiredState));
		const taxonHasNoInapplicableState = !character.inapplicableStates.some((inapplicableState: State) => this.hasTaxonState(taxon, inapplicableState));
		return taxonHasAllRequiredStates && taxonHasNoInapplicableState;
	}

	taxonStatesForCharacter(taxon: { id: string }, character: { id: string }): State[] {
		const states: State[] = [];

		this.taxonsHierarchy.itemWithId(taxon.id)?.states.forEach(state => {
			if (this.characterHasState(character, state)) {
				states.push(state);
			}
		});
		return states;
	}

	taxonDescriptions(taxon: Taxon): Array<Description> {
		const statesByCharacter = new OneToManyBimap(Map);
		const descriptions = new Array<Description>();
	
		for (const character of this.charactersHierarchy.allItems) {
			for (const state of character.states) {
				if (taxon.states.some(s => s.id === state.id)) {
					statesByCharacter.add(character.id, state.id);
				}
			}
		}
		for (const [characterId, stateIds] of statesByCharacter.rightIdsGroupedByLeftId()) {
			const character = this.charactersHierarchy.itemWithId(characterId);
			if (typeof character !== "undefined") {
				descriptions.push({ character, states: this.statesFromIds(stateIds) });
			}
		}
		return descriptions;
	}

	taxonCharactersTree(taxon: Taxon): Hierarchy<Character & { selected?: boolean }> {
		const dependencyHierarchy: Hierarchy<Character & { selected?: boolean }> = clone(this.charactersHierarchy);

		for (const character of this.characters) {
			if (this.isApplicable({ character, taxon })) {
				const characterStates = map(this.characterStates(character),
					(s: State) => Object.assign({
						type: "state",
						parentId: character.id,
						selected: this.hasTaxonState(taxon, s),
					}, s));
				const characterChildren = [...dependencyHierarchy.childrenOf(character)];
				
				for (const state of characterStates) {
					const inherentCharacter = characterChildren.find(characterChild => characterChild.inherentState?.id === state.id);
					if (typeof inherentCharacter === "undefined") {
						dependencyHierarchy.add(state as unknown as Character);
					} else {
						inherentCharacter.selected = state.selected;
					}
				}
			} else {
				dependencyHierarchy.remove(character);
			}
		}
		return dependencyHierarchy;
	}

	onStateAdded(callback: StateCallback) {
        this.stateAdditionCallbacks.add(callback);
    }

    onStateRemoved(callback: StateCallback) {
        this.stateRemovalCallbacks.add(callback);
    }

	addState(state: State, character: Character) {
        state.id = generateId(this.statesById, state);
		this.statesById.set(state.id, state);
		character.states.push(state);
        for (const callback of this.stateAdditionCallbacks) {
            callback({ state, character });
        }
    }

	private removeStateWithoutCharacter(state: State) {
		this.statesById.delete(state.id);
	}

    removeState(state: State, character: Character) {
		this.removeStateWithoutCharacter(state);

        function removeStateFromArray(array: State[], state: State) {
            const index = array.findIndex(s => s.id === state.id);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }
		removeStateFromArray(character.states, state);

		for (const characterChild of this.charactersHierarchy.childrenOf(character)) {
			removeStateFromArray(characterChild.inapplicableStates, state);
			removeStateFromArray(characterChild.requiredStates, state);
			if (characterChild.inherentState?.id === state.id) {
				characterChild.inherentState = undefined;
			}
		}

        for (const callback of this.stateRemovalCallbacks) {
            callback({ state, character });
        }
    }

    characterHasState(character: { id: string }|undefined, state: { id: string }|undefined): boolean {
        return typeof character !== "undefined" &&
            typeof state !== "undefined" &&
            (this.charactersHierarchy.itemWithId(character.id)?.states.some(s => s.id === state.id) ?? false);
    }

	characterStates(character: Character|undefined): Iterable<State> {
		return character?.states ?? [];
    }

    *allStates(): Iterable<State> {
		for (const character of this.charactersHierarchy.allItems) {
			for (const state of character.states) {
				yield state;
			}
		}
    }
}
