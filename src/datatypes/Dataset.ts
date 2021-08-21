import { Book, CharacterProps, CharacterPreset, Description, DictionaryEntry, Field, HierarchicalItem, State, TaxonProps, HierarchicalItemInit, SelectableHierarchicalItem } from "./types";
import { createHierarchicalItem, filterHierarchy, forEachItem, mapHierarchy, updateIn } from "./HierarchicalItem";
import { standardBooks } from "./stdcontent";
import { Hierarchy, IMap } from './hierarchy';
import clone from "@/tools/clone";
import { map } from "@/tools/iter";
import { generateId, itemWithIdNotIn } from "@/tools/generateid";
import Month from "./Months";
import { getIn, getParent, removeIn } from "./HierarchicalItem";

export class Dataset {
	private statesById: IMap<State>;
	presetStates: Record<CharacterPreset, State[]> = {
		flowering: Month.floweringStates,
		family: [],
	};

	constructor(
			public id: string,
			public taxonsHierarchy: HierarchicalItem,
			public charactersHierarchy: HierarchicalItem,
			public taxonsProps: IMap<TaxonProps>,
			public charProps: IMap<CharacterProps>,
			public dictionaryEntries: IMap<DictionaryEntry>,
			public books: Book[] = standardBooks.slice(),
			public extraFields: Field[] = [],
			statesById: IMap<State>|undefined) {
		this.statesById = statesById ?? new Map();
		for (const character of charProps.values()) {
			character.states = character.states.map(itemWithIdNotIn(this.statesById));
			character.states.forEach(s => this.statesById.set(s.id, s));
		}
		for (const taxon of taxonsHierarchy.children) {
			this.addFamilyPreset(taxon);
		}
	}

	private addFamilyPreset(taxon: HierarchicalItem) {
		this.presetStates.family.push({
			id: "s-auto-" + taxon.id,
			name: clone(taxon.name),
			pictures: clone(this.taxonsProps.get(taxon.id)?.pictures) ?? [],
		});
	}

	addTaxon(taxonInit: HierarchicalItemInit, props: TaxonProps, path: number[] = []) {
		const taxon = createHierarchicalItem("t", this.taxonsProps, taxonInit);
		this.taxonsProps.set(taxon.id, props);
		getIn(this.taxonsHierarchy, path).children.push(taxon);
		if (path.length === 0) {
			this.addFamilyPreset(taxon);
		}
	}

	removeTaxon(path: number[]) {
		const taxon = removeIn(this.taxonsHierarchy, path);
		if (path.length === 0) {
			const index = this.presetStates.family.findIndex(family => family.id === "s-auto-" + taxon.id);
	
			if (index >= 0) {
				this.removeStateWithoutCharacter(this.presetStates.family[index]);
				this.presetStates.family.splice(index, 1);
			}
		}
	}

	changeTaxonParent(taxonPath: number[], newParentPath: number[]) {
		const taxon = removeIn(this.taxonsHierarchy, taxonPath);
		const newParent = getIn(this.taxonsHierarchy, newParentPath);
		updateIn(this.taxonsHierarchy, newParentPath, parent => {
			const taxonIndex = parent.children.findIndex(t => t.id === taxon.id);
			if (taxonIndex >= 0) {
				parent.children.splice()
			}
		});
	}

	addCharacter(charInit: HierarchicalItemInit, props: CharacterProps, path: number[] = []) {
		const character = createHierarchicalItem("c", this.charProps, charInit);
		this.charProps.set(character.id, props);
		getIn(this.charactersHierarchy, path).children.push(character);
		props.states = props.states.map(itemWithIdNotIn(this.statesById));
		if (typeof charInit.id === "undefined") {
			const parentCharacter = getParent(this.charactersHierarchy, path);
			if (typeof parentCharacter !== "undefined") {
                const newState: State = itemWithIdNotIn<State>(this.statesById)({id: "", name: clone(character.name), pictures: []});
                this.addState(newState, parentCharacter.id);
                props.inherentState = newState;
            }
		}
	}

	removeCharacter(path: number[]) {
		const character = removeIn(this.charactersHierarchy, path);
		const charProps = this.charProps.get(character.id);
		this.charProps.get(character.id)?.states.forEach(s => this.statesById.delete(s.id));
		this.charProps.delete(character.id);
		const inherentState = charProps?.inherentState;
		if (typeof inherentState !== "undefined") {
			const parent = getParent(this.charactersHierarchy, path);
			if (typeof parent !== "undefined") {
				const parentProps = this.charProps.get(parent.id);
				const index = parentProps?.states.findIndex(s => s.id === inherentState.id) ?? -1;
				if (index >= 0) {
					parentProps?.states.splice(index, 1);
				}
			}
		}
	}

	hasTaxonState(taxonId: string, stateId: string) {
		const props = this.taxonsProps.get(taxonId);
		return props?.states.some(s => s.id === stateId);
	}

	setTaxonState(taxonId: string, state: State) {
		const props = this.taxonsProps.get(taxonId);
		const s = this.statesById.get(state.id);
		if (typeof props !== "undefined" && typeof s !== "undefined") {
			props?.states.push(s);
		}
	}

	removeTaxonState(taxon: HierarchicalItem, state: State) {
		const props = this.taxonsProps.get(taxon.id);
		if (typeof props !== "undefined") {
			const stateIndex = props.states.findIndex(s => s.id === state.id);
			if (stateIndex >= 0) {
				props.states.splice(stateIndex, 1);
			}
		}
	}

	statesFromIds(stateIds: readonly string[] | undefined): State[] {
		return stateIds?.map(id => this.statesById.get(id)).filter(s => typeof s !== "undefined") as State[] ?? [];
	}

	taxonStates(taxon: HierarchicalItem|undefined): State[] {
		if (typeof taxon === "undefined") {
			return [];
		} else {
			return this.taxonsProps.get(taxon.id)?.states ?? [];
		}
	}

	private isApplicable({characterId, taxonId}: { characterId: string, taxonId: string }): boolean {
		const character = this.charProps.get(characterId);
		if (typeof character === "undefined") {
			return false;
		} else {
			const taxonHasAllRequiredStates = character.requiredStates.every((requiredState: State) => this.hasTaxonState(taxonId, requiredState.id));
			const taxonHasNoInapplicableState = !character.inapplicableStates.some((inapplicableState: State) => this.hasTaxonState(taxonId, inapplicableState.id));
			return taxonHasAllRequiredStates && taxonHasNoInapplicableState;
		}
	}

	taxonStatesForCharacter(taxonId: string, characterId: string): State[] {
		const states: State[] = [];

		this.taxonsProps.get(taxonId)?.states.forEach(state => {
			if (this.characterHasState(characterId, state.id)) {
				states.push(state);
			}
		});
		return states;
	}

	*taxonDescriptions(taxon: TaxonProps): Iterable<Description> {
		const statesByCharacter = new Map<string, { character: HierarchicalItem, states: State[] }>();
	
		forEachItem(this.charactersHierarchy, item => {
			const character = this.charProps.get(item.id)!;
			for (const state of character.states) {
				if (taxon.states.some(s => s.id === state.id)) {
					let entry = statesByCharacter.get(character.id);
					if (typeof entry === "undefined") {
						entry = { character: item, states: [] };
						statesByCharacter.set(character.id, entry);
					}
					entry.states.push(state);
				}
			}
		});
		return statesByCharacter.values();
	}

	taxonCharactersTree(taxonId: string): SelectableHierarchicalItem {
		return (
			filterHierarchy(character => this.isApplicable({ characterId: character.id, taxonId }))(
			mapHierarchy(character => {
				const newChar = clone(character);
				const characterStates = map(this.characterStates(character.id),
					(s: State) => Object.assign({
						type: "state" as "state",
						selected: this.hasTaxonState(taxonId, s.id),
						hidden: false,
						children: [],
					}, s));
				
				for (const state of characterStates) {
					const inherentCharacter: SelectableHierarchicalItem|undefined =
						newChar.children.find(characterChild => this.charProps.get(characterChild.id)?.inherentState?.id === state.id);
					if (typeof inherentCharacter === "undefined") {
						newChar.children.push(state);
					} else {
						inherentCharacter.selected = state.selected;
					}
				}
				return character;
			})(this.charactersHierarchy)));
	}

	addState(state: State, characterId: string) {
        state.id = generateId("s", this.statesById, state.id);
		this.statesById.set(state.id, state);
		this.charProps.get(characterId)?.states.push(state);
    }

	private removeStateWithoutCharacter(state: State) {
		this.statesById.delete(state.id);
	}

    removeState(state: State, path: number[]) {
		this.removeStateWithoutCharacter(state);

        function removeStateFromArray(array: State[], state: State) {
            const index = array.findIndex(s => s.id === state.id);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }
		const item = getIn(this.charactersHierarchy, path);
		const character = this.charProps.get(item.id);
		if (typeof character !== "undefined") {
			removeStateFromArray(character.states, state);
	
			for (const itemChild of item.children) {
				const characterChild = this.charProps.get(itemChild.id);
				if (typeof characterChild !== "undefined") {
					removeStateFromArray(characterChild.inapplicableStates, state);
					removeStateFromArray(characterChild.requiredStates, state);
					if (characterChild.inherentState?.id === state.id) {
						characterChild.inherentState = undefined;
					}
				}
			}
		}
    }

    characterHasState(characterId: string, stateId: string): boolean {
		const character = this.charProps.get(characterId);
        return typeof character !== "undefined" &&
            (character?.states.some(s => s.id === stateId) ?? false);
    }

	characterStates(characterId: string): Iterable<State> {
		return this.charProps.get(characterId)?.states ?? [];
    }

    *allStates(): Iterable<State> {
		for (const character of this.charProps.values()) {
			for (const state of character.states) {
				yield state;
			}
		}
    }
}
