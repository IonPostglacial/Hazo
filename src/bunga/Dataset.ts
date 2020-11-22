import { Book, Character, Field, Picture, State, Taxon } from "./datatypes";
import { standardBooks } from "./stdcontent";
import { ManyToManyBimap } from "@/tools/bimaps";
import { Hierarchy } from './hierarchy';
import { CharactersHierarchy } from './CharactersHierarchy';


export class Dataset {
	constructor(
		public id: string,
		public taxonsHierarchy: Hierarchy<Taxon>,
		public charactersHierarchy: CharactersHierarchy,
		public states: Record<string, State>,
		public statesByTaxons: ManyToManyBimap,
		public books: Book[] = standardBooks.slice(),
		public extraFields: Field[] = [],
		public dictionaryEntries: Record<string, any> = {}) {}

	addTaxon(taxon: Taxon) {
		this.taxonsHierarchy.add(taxon);	
	}

	removeTaxon(taxon: Taxon) {
		this.taxonsHierarchy.remove(taxon);
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

	addState(state: State) {
		this.charactersHierarchy.addState(state);
	}

	removeState(state: State) {
		this.charactersHierarchy.removeState(state);
		this.statesByTaxons.removeRight(state.id);
	}
}