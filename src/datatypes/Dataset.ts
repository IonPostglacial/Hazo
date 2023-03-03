import { SelectableItem, Book, Character, CharacterPreset, Description, DiscreteCharacter, Field, HierarchicalItem, State, Taxon } from "./types";
import { standardBooks } from "./stdcontent";
import { cloneHierarchy, forEachHierarchy, Hierarchy, iterHierarchy, transformHierarchy } from './hierarchy';
import clone from "@/tools/clone";
import { generateId } from "@/tools/generateid";
import Month from "./Months";


interface StateCallback {
    (e: { state: State, character: Character }): void;
}

function addItem<T extends HierarchicalItem>(prefix: string, hierarchy: Hierarchy<T>, itemsByIds: Map<string, Hierarchy<T>>, item: Hierarchy<T>): T {
	const it = cloneHierarchy(item);
	const declaredParent = it.parentId ? itemsByIds.get(it.parentId) : undefined;
	if (typeof declaredParent === "undefined") {
		console.warn("Error importing character", it.id, "parent missing:", it.parentId);
		it.parentId = undefined;
	}
	const parent = it.parentId ? itemsByIds.get(it.parentId) ?? hierarchy : hierarchy;
	const newIdsByOldIds = new Map<string, string>();

	forEachHierarchy(it, child => {
		if (newIdsByOldIds.has(child.parentId??"")) {
			child.parentId = newIdsByOldIds.get(child.parentId??"");
		}
		if (!child.id || itemsByIds.has(child.id)) {
			child.id = "";
			child.id = generateId(prefix, itemsByIds, child);
		}
		itemsByIds.set(child.id, child);
    });
	parent.children.push(it);
	return it;
}

function removeItem<T extends HierarchicalItem>(hierarchy: Hierarchy<T>, itemsByIds: Map<string, Hierarchy<T>>, id: string): T|undefined {
	const it = itemsByIds.get(id);
	if (typeof it === "undefined") return undefined;
	const parent = it.parentId ? itemsByIds.get(it.parentId) ?? hierarchy : hierarchy;
	const i = parent.children.findIndex(t => t.id === id);
	parent.children.splice(i, 1);
	itemsByIds.delete(id);
	return it;
}

function moveUp<T extends HierarchicalItem>(hierarchy: Hierarchy<T>, itemsByIds: Map<string, Hierarchy<T>>, item: Hierarchy<T>) {
    const parent = item.parentId ? itemsByIds.get(item.parentId) ?? hierarchy : hierarchy;
    const siblings = parent.children;
    const index = siblings.findIndex(it => it.id === item.id);
    if (index > 0) {
        const tmp = siblings[index - 1];
        siblings[index - 1] = siblings[index];
        siblings[index] = tmp;
    }
}

function moveDown<T extends HierarchicalItem>(hierarchy: Hierarchy<T>, itemsByIds: Map<string, Hierarchy<T>>, item: Hierarchy<T>) {
    const parent = item.parentId ? itemsByIds.get(item.parentId) ?? hierarchy : hierarchy;
    const siblings = parent.children;
    const index = siblings.findIndex(it => it.id === item.id);
    if (index < siblings.length - 1) {
        const tmp = siblings[index + 1];
        siblings[index + 1] = siblings[index];
        siblings[index] = tmp;
    }
}

export class Dataset {
	stateAdditionCallbacks = new Set<StateCallback>();
    stateRemovalCallbacks = new Set<StateCallback>();
	statesById: Map<string, State>;
	taxonsByIds: Map<string, Taxon>;
	charactersByIds: Map<string, Character>;
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
			statesById: Map<string, State>|undefined) {
		this.statesById = statesById ?? new Map();
		this.taxonsByIds = new Map();
		this.charactersByIds = new Map();
		forEachHierarchy(charactersHierarchy, character => {
			this.charactersByIds.set(character.id, character);
			if (character.characterType === "discrete") {
				character.states.forEach(s => this.indexState(s));
			}
		});
		forEachHierarchy(taxonsHierarchy, taxon => {
			this.taxonsByIds.set(taxon.id, taxon);
			this.addFamilyPreset(taxon);
		});
	}

	private addFamilyPreset(taxon: Taxon) {
		if (taxon.parentId) return;

		this.presetStates.family.push({
			id: "s-auto-" + taxon.id,
			type: "state",
			name: clone(taxon.name),
			pictures: clone(taxon.pictures),
		});
	}

	private indexState(state: State) {
		this.statesById.set(state.id, state);
	}

	taxon(id: string|undefined): Taxon|undefined {
		if (typeof id === "undefined") {
			return undefined;
		} else {
			return this.taxonsByIds.get(id);
		}
	}

	taxonParentChain(id: string|undefined): Taxon[] {
		const parents: Taxon[] = [];
		while (typeof id !== undefined) {
			const taxon = this.taxon(id);
			if (typeof taxon !== "undefined") {
				parents.unshift(taxon);
				id = taxon.parentId;
			} else {
				break;
			}
		}
		return parents;
	}

	character(id: string|undefined): Character|undefined {
		if (typeof id === "undefined") {
			return undefined;
		} else {
			return this.charactersByIds.get(id);
		}
	}

	addTaxon(taxon: Taxon) {
		const t = addItem("t", this.taxonsHierarchy, this.taxonsByIds, taxon);
		this.addFamilyPreset(t);
	}

	moveTaxonUp(taxon: Taxon) {
		moveUp(this.taxonsHierarchy, this.taxonsByIds, taxon);
	}

	moveTaxonDown(taxon: Taxon) {
		moveDown(this.taxonsHierarchy, this.taxonsByIds, taxon);
	}

	setTaxon(id: string, props: Partial<Taxon>) {
		const taxon = this.taxon(id);
		Object.assign(taxon as any, props);
	}

	removeTaxon(id: string) {
		const taxon = removeItem(this.taxonsHierarchy, this.taxonsByIds, id);
		if (typeof taxon === "undefined") return;
		const index = this.presetStates.family.findIndex(family => family.id === "s-auto-" + taxon.id);

		if (index >= 0) {
			this.removeStateWithoutCharacter(this.presetStates.family[index]);
			this.presetStates.family.splice(index, 1);
		}
	}

	get taxons() {
		return iterHierarchy(this.taxonsHierarchy);
	}

	getTaxonsByIds() {
		return this.taxonsByIds;
	}

	changeTaxonParent(id: string, newParentId: string) {
		const taxon = this.taxon(id);
		if (typeof taxon === "undefined") return;
		const oldParent = this.taxon(taxon.parentId) ?? this.taxonsHierarchy;
		const i = oldParent.children.findIndex(t => t.id === id);
		oldParent.children.splice(i, 1);
		const parent = this.taxon(newParentId) ?? this.taxonsHierarchy;
		parent.children.push(taxon);
	}

	addCharacter(character: Character) {
		const autoid = !character.id;
		const c = addItem("c", this.charactersHierarchy, this.charactersByIds, character);
		if (c.characterType === "discrete") {
			c.states.forEach(s => this.indexState(s));
		}
		if (autoid && c.characterType === "discrete") {
            const parentCharacter = this.character(c.parentId);
            if (parentCharacter?.characterType === "discrete") {
                const newState: State = {
                    id: "s-auto-" + c.id,
					type: "state",
                    name: Object.assign({}, c.name), pictures: []
                };
                this.addState(newState, parentCharacter);
                c.inherentState = newState;
            }
		}
	}

	moveCharacterUp(ch: Character) {
		moveUp(this.charactersHierarchy, this.charactersByIds, ch);
	}

	moveCharacterDown(ch: Character) {
		moveDown(this.charactersHierarchy, this.charactersByIds, ch);
	}

	setCharacter(id: string, props: Partial<Character>) {
		const character = this.character(id);
		Object.assign(character as any, props);
	}

	removeCharacter(id: string) {
		const character = removeItem(this.charactersHierarchy, this.charactersByIds, id);
		if (typeof character === "undefined") return;
		if (character.characterType === "discrete") {
			character.states.forEach(s => this.statesById.delete(s.id));
		}
		const parent = this.character(character.parentId);
		if (parent && parent.characterType === "discrete") {
			const inherentStateId = "s-auto-" + id;
			for (const state of parent.states) {
				if (state.id === inherentStateId) {
					this.removeState(state, parent);
				}
			}
		}
	}

	get characters() {
		return iterHierarchy(this.charactersHierarchy);
	}

	getCharactersByIds() {
		return this.charactersByIds;
	}

	hasTaxonState(taxonId: string, state: State) {
		return this.taxon(taxonId)?.states.some(s => s.id === state.id);
	}

	setTaxonState(taxonId: string, state: State) {
		const s = this.statesById.get(state.id);
		const t = this.taxon(taxonId);
		if (typeof s !== "undefined" && typeof t !== "undefined") {
			t.states.push(s);
		}
	}

	removeTaxonState(taxonId: string, state: State) {
		const t = this.taxon(taxonId);
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

	taxonStates(taxonId: string): State[] {
		return this.taxon(taxonId)?.states ?? [];
	}

	private isApplicable({character, taxon}: { character: Character, taxon: Taxon }): boolean {
		const taxonHasAllRequiredStates = character.requiredStates.every((requiredState: State) => 
			taxon.states.some(s => s.id === requiredState.id));
		const taxonHasNoInapplicableState = !character.inapplicableStates.some((inapplicableState: State) => 
			taxon.states.some(s => s.id === inapplicableState.id));
		return taxonHasAllRequiredStates && taxonHasNoInapplicableState;
	}

	taxonStatesForCharacter(taxonId: string, characterId: string): State[] {
		const states: State[] = [];

		this.taxon(taxonId)?.states.forEach(state => {
			if (this.characterHasState(characterId, state)) {
				states.push(state);
			}
		});
		return states;
	}

	taxonDescriptions(taxon: Taxon): Array<Description> {
		const descriptions = new Array<Description>();
	
		forEachHierarchy(this.charactersHierarchy, character => {
			const states = [];
			if (character.characterType === "discrete") {
				for (const state of character.states) {
					if (taxon.states.some(s => s.id === state.id)) {
						states.push(state);
					}
				}
			}
			if (states.length > 0) {
				descriptions.push({ character, states })
			}
		});
		return descriptions;
	}

	taxonCharactersTree(taxon: Taxon): Hierarchy<SelectableItem> {
		const dependencyHierarchy = transformHierarchy(this.charactersHierarchy, {
			filter: character => this.isApplicable({ character, taxon }),
			map(character): Hierarchy<SelectableItem> {
				const characterStates = character.characterType === "range" ? [] : character.states.map(s => Object.assign({
						type: "state",
						parentId: character.id,
						selected: taxon.states.some(state => state.id === s.id),
					}, s));
				const clonedChildren = clone(character.children);
				const characterChildren: Hierarchy<SelectableItem>[] = [...clonedChildren];
				for (const state of characterStates) {
					const inherentCharacter: Character & {selected?:boolean}|undefined = clonedChildren.find(characterChild => 
						characterChild.characterType === "range" ? undefined : characterChild.inherentState?.id === state.id);
					if (typeof inherentCharacter === "undefined") {
						characterChildren.push({ ...state, hidden: false, children: [] });
					} else {
						inherentCharacter.selected = state.selected;
					}
				}
				return  { ...character, children: characterChildren };
			},
		});
		return dependencyHierarchy;
	}

	onStateAdded(callback: StateCallback) {
        this.stateAdditionCallbacks.add(callback);
    }

    onStateRemoved(callback: StateCallback) {
        this.stateRemovalCallbacks.add(callback);
    }

	addState(state: State, character: DiscreteCharacter) {
        state.id = generateId("s", this.statesById, state);
		this.statesById.set(state.id, state);
		character.states.push(state);
        for (const callback of this.stateAdditionCallbacks) {
            callback({ state, character });
        }
    }

	private removeStateWithoutCharacter(state: State) {
		this.statesById.delete(state.id);
	}

    removeState(state: State, character: DiscreteCharacter) {
		this.removeStateWithoutCharacter(state);

        function removeStateFromArray(array: State[], state: State) {
            const index = array.findIndex(s => s.id === state.id);
            if (index >= 0) {
                array.splice(index, 1);
            }
        }
		removeStateFromArray(character.states, state);

		for (const characterChild of character.children) {
			if (characterChild.characterType === "range") continue;
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

    characterHasState(characterId: string, state: { id: string }|undefined): boolean {
		const ch = this.character(characterId);
        return typeof state !== "undefined" && ch?.characterType === "discrete" &&
            (ch?.states.some(s => s.id === state.id) ?? false);
    }

	characterStates(character: Character|undefined): State[] {
		return character?.characterType === "discrete" ? character.states : [];
    }

    *allStates(): Iterable<State> {
		for (const character of iterHierarchy(this.charactersHierarchy)) {
			if (character.characterType === "range") continue;
			for (const state of character.states) {
				yield state;
			}
		}
    }
}
