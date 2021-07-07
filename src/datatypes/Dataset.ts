import { Book, Character, CharacterType, Description, DictionaryEntry, Field, State, Taxon } from "./types";
import { standardBooks } from "./stdcontent";
import { ManyToManyBimap, OneToManyBimap } from "@/tools/bimaps";
import { Hierarchy, IMap } from './hierarchy';
import clone from "@/tools/clone";
import { map } from "@/tools/iter";
import { floweringStates } from "./Character";
import { generateId } from "@/tools/generateid";

interface StateCallback {
    (e: { state: State, character: Character }): void;
}

export class Dataset {
	private floweringCharacter: Character|undefined = undefined;
	private stateAdditionCallbacks = new Set<StateCallback>();
    private stateRemovalCallbacks = new Set<StateCallback>();
    private characterByStateId: IMap<Character>;
	private statesById: IMap<State>;

	constructor(
			public id: string,
			public taxonsHierarchy: Hierarchy<Taxon>,
			public charactersHierarchy: Hierarchy<Character>,
			public statesByTaxons: ManyToManyBimap,
			public dictionaryEntries: IMap<DictionaryEntry>,
			public books: Book[] = standardBooks.slice(),
			public extraFields: Field[] = [],
			statesById: IMap<State>|undefined, characterByStateId: IMap<Character>|undefined) {
		this.statesById = statesById ?? new Map();
		for (const character of charactersHierarchy.allItems) {
			character.states.forEach(s => this.indexState(s));
		}
		this.characterByStateId = characterByStateId ?? new Map();
		this.charactersHierarchy.onAdd(this.onAddCharacter.bind(this));
		this.charactersHierarchy.onClone(this.onCharacterCloned.bind(this));
		this.charactersHierarchy.onRemove(c => c.states.forEach(s => this.statesById.delete(s.id)));
	}

	private indexState(state: State) {
		this.statesById.set(state.id, state);
	}

	onAddCharacter(character: Character, autoid: boolean) {
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
		if (character.charType === "flowering") {
			this.floweringCharacter = character;
		}
	}

	onCharacterCloned(hierarchy: Hierarchy<Character>, character: Character, clonedCharacter: Character, newParent: Character|undefined) {
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
	}

	removeTaxon(taxon: Taxon) {
		this.taxonsHierarchy.remove(taxon);
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
		this.charactersHierarchy.add(character);
	}

	removeCharacter(character: Character) {
		character.states.forEach(s => this.statesById.delete(s.id));
		this.charactersHierarchy.remove(character);
	}

	get characters() {
		return this.charactersHierarchy.allItems;
	}

	hasTaxonState(taxon: Taxon, state: State) {
		return this.statesByTaxons.has(taxon.id, state.id);
	}

	statesFromIds(stateIds: readonly string[] | undefined): State[] {
		return stateIds?.map(id => this.statesById.get(id)).filter(s => typeof s !== "undefined") as State[] ?? [];
	}

	taxonStates(taxon: Taxon|undefined): State[] {
		if (typeof taxon === "undefined") return [];
		else return this.statesFromIds(this.statesByTaxons.getRightIdsByLeftId(taxon.id));
	}

	stateTaxons(state: State|undefined): Taxon[] {
		if (typeof state === "undefined") return [];
		else return this.statesByTaxons.getLeftIdsByRightId(state.id)?.map(id => this.taxonsHierarchy.itemWithId(id)!)?.filter(t => typeof t !== "undefined") ?? [];
	}

	private isApplicable({character, taxon}: { character: Character, taxon: Taxon|undefined }): boolean {
		if (typeof taxon === "undefined") return false;

		const taxonHasAllRequiredStates = character.requiredStates.every((requiredState: State) => this.hasTaxonState(taxon, requiredState));
		const taxonHasNoInapplicableState = !character.inapplicableStates.some((inapplicableState: State) => this.hasTaxonState(taxon, inapplicableState));
		return taxonHasAllRequiredStates && taxonHasNoInapplicableState;
	}

	taxonStatesForCharacter(taxon: { id: string }, character: { id: string, charType: CharacterType }): State[] {
		const stateIds: string[] = [];

		this.statesByTaxons.getRightIdsByLeftId(taxon.id)?.forEach(stateId => {
			if (this.characterHasState(character, { id: stateId })) {
				stateIds.push(stateId);
			}
		});
		return this.statesFromIds(stateIds);
	}

	*taxonDescriptions(taxon: Taxon): Iterable<Description> {
		const statesByCharacter = new OneToManyBimap(Map);
	
		for (const stateId of this.statesByTaxons.getRightIdsByLeftId(taxon.id) ?? []) {
			const character = this.stateCharacter({id: stateId});
			if (typeof character !== "undefined") {
				statesByCharacter.add(character.id, stateId);
			} else if (this.floweringCharacter && floweringStates.find(s => s.id === stateId)) {
				statesByCharacter.add(this.floweringCharacter.id, stateId);
			}
		}
		for (const [characterId, stateIds] of statesByCharacter.rightIdsGroupedByLeftId()) {
			const character = this.charactersHierarchy.itemWithId(characterId);
			if (typeof character !== "undefined") {
				yield { character, states: this.statesFromIds(stateIds) };
			} else if (this.floweringCharacter) {
				yield { character: this.floweringCharacter, states: this.statesFromIds(stateIds) };
			}
		}
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
		this.characterByStateId.set(state.id, character);
        for (const callback of this.stateAdditionCallbacks) {
            callback({ state, character });
        }
    }

    removeState(state: State) {
		this.statesByTaxons.removeRight(state.id);
        const character = this.characterByStateId.get(state.id);
        if (typeof character === "undefined") return;

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

    characterHasState(character: { id: string, charType: CharacterType }|undefined, state: { id: string }|undefined): boolean {
        return typeof character !== "undefined" &&
            typeof state !== "undefined" &&
            (character.charType === "flowering" || (this.charactersHierarchy.itemWithId(character.id)?.states.some(s => s.id === state.id) ?? false));
    }

	*characterStates(character: Character|undefined): Iterable<State> {
		if (typeof character === "undefined") return [];
        if (character.charType === "flowering") {
            yield* floweringStates;
        } else {
            for (const state of character.states) {
                yield state;
            }
        }
    }

	stateCharacter(state: {id: string}): Character|undefined {
		return this.characterByStateId.get(state.id);
    }

    *allStates(): Iterable<State> {
		return this.statesById.values();
    }
}
