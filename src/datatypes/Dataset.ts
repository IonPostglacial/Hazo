import { Book, Character, CharacterType, Description, DictionaryEntry, Field, State, Taxon } from "./types";
import { standardBooks } from "./stdcontent";
import { ManyToManyBimap, OneToManyBimap } from "@/tools/bimaps";
import { Hierarchy, IMap } from './hierarchy';
import { CharactersHierarchy } from './CharactersHierarchy';
import clone from "@/tools/clone";
import { map } from "@/tools/iter";


export class Dataset {
	constructor(
			public id: string,
			public taxonsHierarchy: Hierarchy<Taxon>,
			public charactersHierarchy: CharactersHierarchy,
			public statesByTaxons: ManyToManyBimap,
			public dictionaryEntries: IMap<DictionaryEntry>,
			public books: Book[] = standardBooks.slice(),
			public extraFields: Field[] = []) {
		this.charactersHierarchy.onAdd(this.onAddCharacter.bind(this));
		this.charactersHierarchy.onClone(this.onCharacterCloned.bind(this));
		this.charactersHierarchy.onRemove(character => this.charactersHierarchy.statesByCharacter.removeLeft(character.id));
		this.charactersHierarchy.onClear(() => this.charactersHierarchy.states.clear())
		this.charactersHierarchy.onStateRemoved(e => this.statesByTaxons.removeRight(e.state.id));
	}

	onAddCharacter(character: Character, autoid: boolean) {
		if (autoid) {
            const parentCharacter = this.charactersHierarchy.itemWithId(character.parentId);
            if(typeof character.parentId !== "undefined" && typeof parentCharacter !== "undefined") {
                const newState: State = {
                    id: "s-auto-" + character.id,
                    name: Object.assign({}, character.name), pictures: []
                };
                this.charactersHierarchy.addState(newState, parentCharacter);
                character.inherentState = newState;
            }
		}
	}

	onCharacterCloned(hierarchy: Hierarchy<Character>, character: Character, clonedCharacter: Character, newParent: Character|undefined) {
		if (!(hierarchy instanceof CharactersHierarchy)) throw "Hierarchy should be a CharactersHierarchy";
		clonedCharacter.requiredStates = [];
        clonedCharacter.inapplicableStates = [];
        clonedCharacter.inherentState = undefined;
        const oldParent = hierarchy.itemWithId(character.parentId);
        const oldStates = hierarchy.characterStates(character);
        const oldRequiredStatesIds = character.requiredStates.map(s => s.id);
        const oldInapplicableStatesIds = character.inapplicableStates.map(s => s.id);
        for (const oldState of oldStates) {
            const newState = clone(oldState);
            newState.id = "";
            this.charactersHierarchy.addState(newState, clonedCharacter);
            if (oldRequiredStatesIds.includes(oldState.id)) {
                clonedCharacter.requiredStates.push(newState);
            }
            if (oldInapplicableStatesIds.includes(oldState.id)) {
                clonedCharacter.inapplicableStates.push(newState);
            }
        }
        if (newParent && character.inherentState?.id) {
            const oldInherentStateIndex = Array.from(hierarchy.characterStates(oldParent)).findIndex(s => s.id === character.inherentState?.id);
            clonedCharacter.inherentState = Array.from(this.charactersHierarchy.characterStates(newParent))[oldInherentStateIndex];
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
		this.charactersHierarchy.remove(character);
	}

	get characters() {
		return this.charactersHierarchy.allItems;
	}

	hasTaxonState(taxon: Taxon, state: State) {
		return this.statesByTaxons.has(taxon.id, state.id);
	}

	taxonStates(taxon: Taxon|undefined): State[] {
		if (typeof taxon === "undefined") return [];
		else return this.charactersHierarchy.statesFromIds(this.statesByTaxons.getRightIdsByLeftId(taxon.id) ?? []);
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
			if (this.charactersHierarchy.characterHasState(character, { id: stateId })) {
				stateIds.push(stateId);
			}
		});
		return this.charactersHierarchy.statesFromIds(stateIds);
	}

	*taxonDescriptions(taxon: Taxon): Iterable<Description> {
		const statesByCharacter = new OneToManyBimap(Map);
	
		for (const stateId of this.statesByTaxons.getRightIdsByLeftId(taxon.id) ?? []) {
			const character = this.charactersHierarchy.stateCharacter({id: stateId});
			if (typeof character !== "undefined") {
				statesByCharacter.add(character.id, stateId);
			}
		}
		for (const [characterId, stateIds] of statesByCharacter.rightIdsGroupedByLeftId()) {
			const character = this.charactersHierarchy.itemWithId(characterId);
			if (typeof character !== "undefined") {
				yield { character, states: this.charactersHierarchy.statesFromIds(stateIds) };
			}
		}
	}

	taxonCharactersTree(taxon: Taxon): Hierarchy<Character & { selected?: boolean }> {
		const dependencyHierarchy: Hierarchy<Character & { selected?: boolean }> = clone(this.charactersHierarchy);

		for (const character of this.characters) {
			if (this.isApplicable({ character, taxon })) {
				const characterStates = map(this.charactersHierarchy.characterStates(character),
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
}
