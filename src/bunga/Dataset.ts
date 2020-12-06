import { Book, Character, Description, DictionaryEntry, Field, State, Taxon } from "./datatypes";
import { standardBooks } from "./stdcontent";
import { ManyToManyBimap, OneToManyBimap } from "@/tools/bimaps";
import { Hierarchy, IMap } from './hierarchy';
import { CharactersHierarchy } from './CharactersHierarchy';


export class Dataset {
	constructor(
			public id: string,
			public taxonsHierarchy: Hierarchy<Taxon>,
			public charactersHierarchy: CharactersHierarchy,
			public states: IMap<State>,
			public statesByTaxons: ManyToManyBimap,
			public statesByCharacter: OneToManyBimap,
			public dictionaryEntries: IMap<DictionaryEntry>,
			public books: Book[] = standardBooks.slice(),
			public extraFields: Field[] = []) {
		this.charactersHierarchy.onStateAdded(e => this.addState(e.state, e.character));
		this.charactersHierarchy.onStateRemoved(e => this.removeState(e.state));
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

	addState(state: State, character: Character) {
		this.states.set(state.id, state);
		this.statesByCharacter.add(character.id, state.id);
	}

	removeState(state: State) {
		this.states.delete(state.id);
		this.statesByCharacter.removeRight(state.id);
		this.statesByTaxons.removeRight(state.id);
	}

	*characterStates(character: Character|undefined): Iterable<State> {
		if (typeof character === "undefined") return [];
		for (const stateId of this.statesByCharacter.getRightIdsByLeftId(character.id) ?? []) {
			const state = this.states.get(stateId);
			if (typeof state !== "undefined") yield state;
		}
	}

	stateCharacter(state: State): Character|undefined {
		return this.charactersHierarchy.itemWithId(this.statesByCharacter.getLeftIdByRightId(state.id));
	}

	hasTaxonState(taxon: Taxon, state: State) {
		return this.statesByTaxons.has(taxon.id, state.id);
	}

	*taxonDescriptions(taxon: Taxon): Iterable<Description> {
		const statesByCharacter = new OneToManyBimap(Map);
	
		for (const stateId of this.statesByTaxons.getRightIdsByLeftId(taxon.id) ?? []) {
			const state = this.states.get(stateId);
			if (typeof state === "undefined") throw "Data corruption in taxon states: " + stateId;
			const characterId = this.statesByCharacter.getLeftIdByRightId(stateId);
			if (typeof characterId === "undefined") throw "Data corruption in character states: " + stateId;
			statesByCharacter.add(characterId, stateId);
		}
		for (const [characterId, stateIds] of statesByCharacter.rightIdsGroupedByLeftId()) {
			const character = this.charactersHierarchy.itemWithId(characterId);
			if (typeof character !== "undefined") {
				console.log("taxon description", characterId, stateIds);
				yield { character, states: stateIds.map(id => this.states.get(id)).filter(s => typeof s !== "undefined") as State[] };
			}
		}
	}
}