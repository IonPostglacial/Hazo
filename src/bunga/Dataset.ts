import { Book, Character, Description, Field, Picture, State, Taxon } from "./datatypes";
import { standardBooks } from "./stdcontent";
import { ManyToManyBimap, OneToManyBimap } from "@/tools/bimaps";
import { Hierarchy } from './hierarchy';
import { CharactersHierarchy } from './CharactersHierarchy';


export class Dataset {
	constructor(
			public id: string,
			public taxonsHierarchy: Hierarchy<Taxon>,
			public charactersHierarchy: CharactersHierarchy,
			public states: Partial<Record<string, State>>,
			public statesByTaxons: ManyToManyBimap,
			public books: Book[] = standardBooks.slice(),
			public extraFields: Field[] = [],
			public dictionaryEntries: Record<string, any> = {}) {
		this.charactersHierarchy.onStateAdded(s => this.states[s.id] = s);
		this.charactersHierarchy.onStateRemoved(s => delete this.states[s.id]);
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

	addState(state: State) {
		this.charactersHierarchy.addState(state);
	}

	removeState(state: State) {
		this.charactersHierarchy.removeState(state);
		this.statesByTaxons.removeRight(state.id);
	}

	hasTaxonState(taxon: Taxon, state: State) {
		return this.statesByTaxons.has(taxon.id, state.id);
	}

	*taxonDescriptions(taxon: Taxon): Iterable<Description> {
		const statesByCharacter = new OneToManyBimap(Map);
	
		for (const stateId of this.statesByTaxons.getRightIdsByLeftId(taxon.id) ?? []) {
			const state = this.states[stateId];
			if (typeof state === "undefined") throw "Data corruption in taxon states: " + stateId;
			statesByCharacter.add(state.descriptorId, state.id);
		}
		for (const [characterId, stateIds] of statesByCharacter.rightIdsGroupedByLeftId()) {
			const character = this.charactersHierarchy.itemWithId(characterId);
			if (typeof character !== "undefined") {
				console.log("taxon description", characterId, stateIds);
				yield { character, states: stateIds.map(id => this.states[id]).filter(s => typeof s !== "undefined") as State[] };
			}
		}
	}
}