import { Book, Character, Dataset, Description, DiscreteCharacter, Field, HierarchicalItem, State, Taxon, BasicInfo } from "./types";
import { standardBooks } from "./stdcontent";
import { cloneHierarchy, forEachHierarchy, Hierarchy, iterHierarchy, transformHierarchy } from './hierarchy';
import clone from "@/tools/clone";
import { generateId } from "@/tools/generateid";


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
        if (newIdsByOldIds.has(child.parentId ?? "")) {
            child.parentId = newIdsByOldIds.get(child.parentId ?? "");
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

function removeItem<T extends HierarchicalItem>(hierarchy: Hierarchy<T>, itemsByIds: Map<string, Hierarchy<T>>, id: string): T | undefined {
    const it = itemsByIds.get(id);
    if (typeof it === "undefined") return undefined;
    const parent = it.parentId ? itemsByIds.get(it.parentId) ?? hierarchy : hierarchy;
    const i = parent.children.findIndex(t => t.id === id);
    parent.children.splice(i, 1);
    itemsByIds.delete(id);
    return it;
}

export function moveCharacterUp<T extends HierarchicalItem>(hierarchy: Hierarchy<T>, itemsByIds: Map<string, Hierarchy<T>>, item: Hierarchy<T>) {
    const parent = item.parentId ? itemsByIds.get(item.parentId) ?? hierarchy : hierarchy;
    const siblings = parent.children;
    const index = siblings.findIndex(it => it.id === item.id);
    if (index > 0) {
        const tmp = siblings[index - 1];
        siblings[index - 1] = siblings[index];
        siblings[index] = tmp;
    }
}

export function moveCharacterDown<T extends HierarchicalItem>(hierarchy: Hierarchy<T>, itemsByIds: Map<string, Hierarchy<T>>, item: Hierarchy<T>) {
    const parent = item.parentId ? itemsByIds.get(item.parentId) ?? hierarchy : hierarchy;
    const siblings = parent.children;
    const index = siblings.findIndex(it => it.id === item.id);
    if (index < siblings.length - 1) {
        const tmp = siblings[index + 1];
        siblings[index + 1] = siblings[index];
        siblings[index] = tmp;
    }
}

export function taxonCharactersTree(taxon: Taxon, charactersHierarchy: Hierarchy<Character>): Hierarchy<BasicInfo> {
    const dependencyHierarchy = transformHierarchy(charactersHierarchy, {
        filter: character => isApplicable({ character, taxon }),
        map(character): Hierarchy<BasicInfo> {
            const characterStates = character.characterType === "range" ? [] : character.states.map(s => Object.assign({
                type: "state",
                parentId: character.id,
            }, s));
            const clonedChildren = clone(character.children);
            const characterChildren: Hierarchy<BasicInfo>[] = [...clonedChildren];
            for (const state of characterStates) {
                const inherentCharacter: Character | undefined = clonedChildren.find(characterChild =>
                    characterChild.characterType === "range" ? undefined : characterChild.inherentState?.id === state.id);
                if (typeof inherentCharacter === "undefined") {
                    characterChildren.push({ ...state, children: [] });
                }
            }
            return { ...character, children: characterChildren };
        },
    });
    return dependencyHierarchy;
}

export function taxonParentChain(ds: Dataset, id: string | undefined): Taxon[] {
    const parents: Taxon[] = [];
    while (typeof id !== undefined) {
        const taxon = taxonFromId(ds, id);
        if (typeof taxon !== "undefined") {
            parents.unshift(taxon);
            id = taxon.parentId;
        } else {
            break;
        }
    }
    return parents;
}

export function taxonDescriptions(ds: Dataset, taxon: Taxon): Array<Description> {
    const descriptions = new Array<Description>();

    forEachHierarchy(ds.charactersHierarchy, character => {
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

function addFamilyPreset(ds: Dataset, taxon: Taxon) {
    if (taxon.parentId) return;

    ds.presetStates.family.push({
        id: "s-auto-" + taxon.id,
        type: "state",
        name: clone(taxon.name),
        pictures: clone(taxon.pictures),
    });
}

function indexState(ds: Dataset, state: State) {
    ds.statesById.set(state.id, state);
}

function isApplicable({ character, taxon }: { character: Character, taxon: Taxon }): boolean {
    const taxonHasAllRequiredStates = character.requiredStates.every((requiredState: State) =>
        taxon.states.some(s => s.id === requiredState.id));
    const taxonHasNoInapplicableState = !character.inapplicableStates.some((inapplicableState: State) =>
        taxon.states.some(s => s.id === inapplicableState.id));
    return taxonHasAllRequiredStates && taxonHasNoInapplicableState;
}

function removeStateWithoutCharacter(ds: Dataset, state: State) {
    ds.statesById.delete(state.id);
}

export function taxonFromId(ds: Dataset, id: string | undefined): Taxon | undefined {
    if (typeof id === "undefined" || id === "") {
        return undefined;
    } else {
        return ds.taxonsByIds.get(id);
    }
}

export function characterFromId(ds: Dataset, id: string | undefined): Character | undefined {
    if (typeof id === "undefined" || id === "") {
        return undefined;
    } else {
        return ds.charactersByIds.get(id);
    }
}

export function* allStates(ds: Dataset): Iterable<State> {
    for (const character of iterHierarchy(ds.charactersHierarchy)) {
        if (character.characterType === "range") { continue; }
        for (const state of character.states) {
            yield state;
        }
    }
}

export function addTaxon(ds: Dataset, taxon: Taxon): Taxon {
    const t = addItem("t", ds.taxonsHierarchy, ds.taxonsByIds, taxon);
    addFamilyPreset(ds, t);
    return t;
}

export function setTaxon(ds: Dataset, id: string, props: Partial<Taxon>) {
    const taxon = taxonFromId(ds, id);
    Object.assign(taxon as any, props);
}

export function removeTaxon(ds: Dataset, id: string) {
    const taxon = removeItem(ds.taxonsHierarchy, ds.taxonsByIds, id);
    if (typeof taxon === "undefined") return;
    const index = ds.presetStates.family.findIndex(family => family.id === "s-auto-" + taxon.id);

    if (index >= 0) {
        removeStateWithoutCharacter(ds, ds.presetStates.family[index]);
        ds.presetStates.family.splice(index, 1);
    }
}

export function changeTaxonParent(ds: Dataset, id: string, newParentId: string) {
    const taxon = taxonFromId(ds, id);
    if (typeof taxon === "undefined") { return; }
    const oldParent = taxonFromId(ds, taxon.parentId) ?? ds.taxonsHierarchy;
    const i = oldParent.children.findIndex(t => t.id === id);
    oldParent.children.splice(i, 1);
    const parent = taxonFromId(ds, newParentId) ?? ds.taxonsHierarchy;
    parent.children.push(taxon);
}

export function addCharacter(ds: Dataset, character: Character): Character {
    const autoid = !character.id;
    const c = addItem("c", ds.charactersHierarchy, ds.charactersByIds, character);
    if (c.characterType === "discrete") {
        c.states.forEach(s => indexState(ds, s));
    }
    if (autoid && c.characterType === "discrete") {
        const parentCharacter = characterFromId(ds, c.parentId);
        if (parentCharacter?.characterType === "discrete") {
            const newState: State = {
                id: "s-auto-" + c.id,
                type: "state",
                name: Object.assign({}, c.name), pictures: []
            };
            addState(ds, newState, parentCharacter);
            c.inherentState = newState;
        }
    }
    return c;
}

export function setCharacter(ds: Dataset, id: string, props: Partial<Character>) {
    const character = characterFromId(ds, id);
    Object.assign(character as any, props);
}

export function removeCharacter(ds: Dataset, id: string) {
    const character = removeItem(ds.charactersHierarchy, ds.charactersByIds, id);
    if (typeof character === "undefined") { return; }
    if (character.characterType === "discrete") {
        character.states.forEach(s => ds.statesById.delete(s.id));
    }
    const parent = characterFromId(ds, character.parentId);
    if (parent && parent.characterType === "discrete") {
        const inherentStateId = "s-auto-" + id;
        for (const state of parent.states) {
            if (state.id === inherentStateId) {
                removeState(ds, state, parent);
            }
        }
    }
}

export function setTaxonState(ds: Dataset, taxonId: string, state: State) {
    const s = ds.statesById.get(state.id);
    const t = taxonFromId(ds, taxonId);
    if (typeof s !== "undefined" && typeof t !== "undefined") {
        t.states.push(s);
    }
}

export function removeTaxonState(ds: Dataset, taxonId: string, state: State) {
    const t = taxonFromId(ds, taxonId);
    if (typeof t !== "undefined") {
        const stateIndex = t.states.findIndex(s => s.id === state.id);
        if (stateIndex >= 0) {
            t.states.splice(stateIndex, 1);
        }
    }
}

export function addState(ds: Dataset, state: State, character: DiscreteCharacter): State {
    state.id = generateId("s", ds.statesById, state);
    ds.statesById.set(state.id, state);
    character.states.push(state);
    return state;
}

export function removeAllCharacterStates(ds: Dataset, character: DiscreteCharacter) {
    const ch = characterFromId(ds, character.id);
    if (ch && ch.characterType === "discrete") {
        ch.states = [];
    }
}

export function removeState(ds: Dataset, state: State, character: DiscreteCharacter) {
    removeStateWithoutCharacter(ds, state);

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
}

type DatasetInit = {
    id: string,
    taxonsHierarchy: Hierarchy<Taxon>,
    charactersHierarchy: Hierarchy<Character>,
    books?: Book[],
    extraFields?: Field[],
    statesById?: Map<string, State> | undefined,
};

export function createDataset(init: DatasetInit): Dataset {
    const ds = {
        id: init.id,
        taxonsHierarchy: init.taxonsHierarchy,
        charactersHierarchy: init.charactersHierarchy,
        books: init.books ?? standardBooks.slice(),
        extraFields: init.extraFields ?? [],
        statesById: init.statesById ?? new Map(),
        taxonsByIds: new Map(),
        charactersByIds: new Map(),
        presetStates: {
            family: [],
        },
    };
    forEachHierarchy(ds.charactersHierarchy, character => {
        ds.charactersByIds.set(character.id, character);
        if (character.characterType === "discrete") {
            character.states.forEach(s => indexState(ds, s));
        }
    });
    forEachHierarchy(ds.taxonsHierarchy, taxon => {
        ds.taxonsByIds.set(taxon.id, taxon);
        addFamilyPreset(ds, taxon);
    });
    return ds;
}
