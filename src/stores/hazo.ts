import { defineStore } from "pinia";
import { Character, DictionaryEntry, Hierarchy, AnyItem, Taxon, cloneHierarchy, State, forEachHierarchy, transformHierarchy, taxonOrAnyChildHasStates, taxonHasStates } from "../datatypes";
import clone from "../tools/clone";
import makeid from '../tools/makeid';
import { fixParentIds } from "../tools/fixes";
import { useDatasetStore } from "./dataset";
import { Dataset } from "../datatypes";
import { IndexInput, characterNameStore, familyNameStore, stateNameStore } from "@/db-index";
import { pathToItem } from "@/datatypes/Dataset";
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

const INDEX_VERSION = 1;
type IndexedDatasets = Record<string, number>;

function getStoredSummaryLangIds(): number[] {
    const stored = window.localStorage.getItem("selectedSummaryLangIds");
    if (stored === null) {
        return [0];
    }
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
        return [0];
    }
    return parsed.filter(n => Number.isSafeInteger(n));
}

export const useHazoStore = defineStore("hazo", () => {
    const selectedTaxon = ref(undefined as string|undefined);
    const selectedCharacter = ref(undefined as string|undefined);
    const dictionary = reactive({ entries: new Array<DictionaryEntry>() });
    const connectedToHub = ref(false);
    const copiedTaxon = ref(null as null | Hierarchy<Taxon>);
    const copiedCharacter = ref(null as null | Hierarchy<Character>);
    const copiedStates = ref([] as State[]);
    const statesAllowList = ref([] as State[]);
    const statesDenyList = ref([] as State[]);
    const selectedSummaryLangIds = ref(getStoredSummaryLangIds());
    const charNameFields = ref([{ label: 'FR', propertyName: 'S'}, { label: 'EN', propertyName: 'EN' }, { label: '中文名', propertyName: 'CN' }]);

    const ds = useDatasetStore();
    const router = useRouter();

    watch(selectedSummaryLangIds, (ids) => {
        window.localStorage.setItem("selectedSummaryLangIds", JSON.stringify(ids));
    });

    const indexedDatasets = computed((): IndexedDatasets => {
        const ids = window.localStorage.getItem("indexedDatasets");
        if (ids) {
            try {
                const indexed = JSON.parse(ids);
                if (Array.isArray(indexed)) {
                    return Object.fromEntries(indexed.map(id => [id, 0]));
                }
                return indexed;
            } catch (e) {
                console.error(e);
            }
        }
        return {};
    });

    const taxonsToDisplay = computed((): Taxon => {
        if (statesAllowList.value.length > 0 || statesDenyList.value.length > 0) {
            return transformHierarchy(ds.taxonsHierarchy, {
                map: t => t,
                filter: t => taxonOrAnyChildHasStates(t, statesAllowList.value) && 
                    (statesDenyList.value.length == 0 || !taxonHasStates(t, statesDenyList.value)),
            });
        } else {
            return ds.taxonsHierarchy;
        }
    });

    const selectedSummaryLangProperties = computed((): string[] => {
        return selectedSummaryLangIds.value.map(id => charNameFields.value[id].propertyName);
    });

    return {  
        selectedTaxon, selectedCharacter, selectedSummaryLangIds, dictionary,
        statesAllowList, statesDenyList,
        connectedToHub, copiedTaxon, copiedCharacter, copiedStates, charNameFields,

        indexedDatasets, selectedSummaryLangProperties, taxonsToDisplay, taxonsHierarchy: ds.taxonsHierarchy,

        addStateToAllowList(state: State) {
            statesAllowList.value = [...statesAllowList.value, state];
        },
        removeStateFromAllowList(state: State) {
            statesAllowList.value = statesAllowList.value.filter(s => s.id !== state.id);
        },
        addStateToDenyList(state: State) {
            statesDenyList.value = [...statesDenyList.value, state];
        },
        removeStateFromDenyList(state: State) {
            statesDenyList.value = statesDenyList.value.filter(s => s.id !== state.id);
        },
        setConnectedToHub(connected: boolean) {
            connectedToHub.value = connected;
        },
        selectTaxon(taxon: Taxon) {
            selectedTaxon.value = taxon.id;
        },
        selectCharacter(character: Character) {
            selectedCharacter.value = character.id;
        },
        unselectTaxon() {
            selectedTaxon.value = "";
            router.push("/taxons");
        },
        unselectCharacter() {
            selectedCharacter.value = "";
            router.push("/characters");
        },
        copyTaxon(taxon: Taxon) {
            copiedTaxon.value = cloneHierarchy(taxon);
        },
        copyCharacter(character: Character) {
            const clonedCharacter = cloneHierarchy(character);
            clonedCharacter.requiredStates = clone(clonedCharacter.requiredStates);
            clonedCharacter.inapplicableStates = clone(clonedCharacter.inapplicableStates);
            if (clonedCharacter.characterType === "discrete") {
                clonedCharacter.states = clone(clonedCharacter.states);
                clonedCharacter.inherentState = clone(clonedCharacter.inherentState);
            }
            copiedCharacter.value = clonedCharacter;
        },
        copyStates(states: State[] | undefined) {
            if (typeof states !== "undefined") {
                copiedStates.value = clone(states);
                copiedStates.value.forEach(s => s.id = "s-" + makeid(8));
            }
        },
        pasteTaxon(targetId: string) {
            if (copiedTaxon.value !== null) {
                const taxon = cloneHierarchy(copiedTaxon.value);
                const newParent = ds.taxonWithId(targetId);
                if (newParent) {
                    taxon.path = pathToItem(newParent);
                }
                fixParentIds(ds.addTaxon(taxon));
            }
        },
        pasteCharacter(targetId: string) {
            if (copiedCharacter.value === null) return;
            const character = cloneHierarchy(copiedCharacter.value);
            const oldRequiredStatesIds = character.requiredStates.map(s => s.id);
            const oldInapplicableStatesIds = character.inapplicableStates.map(s => s.id);
            character.requiredStates = [];
            character.inapplicableStates = [];
            if (character.characterType === "discrete") {
                const oldStates = character.states;
                character.states = [];
                for (const oldState of oldStates) {
                    const newState = clone(oldState);
                    newState.id = "";
                    ds.addState({ state: newState, character });
                    if (oldRequiredStatesIds.includes(oldState.id)) {
                        character.requiredStates.push(newState);
                    }
                    if (oldInapplicableStatesIds.includes(oldState.id)) {
                        character.inapplicableStates.push(newState);
                    }
                }
            }
            const newParent = ds.characterWithId(targetId);
            if (newParent?.characterType === "discrete" && copiedCharacter?.value.characterType === "discrete") {
                if (newParent && copiedCharacter?.value.inherentState?.id) {
                    copiedCharacter.value.inherentState.id = "s-auto-" + copiedCharacter.value.id;
                    newParent.states.push(copiedCharacter.value.inherentState);
                }
            }
            if (newParent) {
                character.path = [...newParent?.path, targetId];
            }
            const ch = ds.addCharacter(character);
            fixParentIds(ch);
            forEachHierarchy(ch, child => {
                if (child.characterType !== "discrete") { return; }
                child.states.forEach(s => {
                    s.path = pathToItem(child);
                });
            });
        },
        pasteStates(characterId: string) {
            for (const s of copiedStates.value) {
                const stateToAdd = clone(s);
                const character = ds.characterWithId(characterId);
                if (typeof character !== "undefined" && character.characterType === "discrete") {
                    ds.addState({ state: stateToAdd, character });
                }
            }
        },
        itemIndexableContent(origin: string, item: AnyItem): IndexInput {
            return { 
                origin,
                img: item.pictures.map(p => p.hubUrl ?? p.url)[0],
                name: { 
                    S: item.name.S, 
                    V: item.name.V ?? "", 
                    EN: item.name.EN ?? "",
                    FR: item.name.FR ?? "",
                    CN: item.name.CN ?? "" ,
                }
            }
        },
        indexDataset(ds: Dataset, force: boolean = false) {
            const indexed = indexedDatasets.value;
            const version = indexed[ds.id] ?? 0;
            if (force || version < INDEX_VERSION) {
                for (const family of ds.taxonsHierarchy.children) {
                    familyNameStore.store(this.itemIndexableContent(ds.id, family));
                }
                forEachHierarchy(ds.charactersHierarchy, ch => {
                    if (ch.id === "c0") { return; }
                    characterNameStore.store(this.itemIndexableContent(ds.id, ch));
                    if (ch.characterType !== "discrete") { return; }
                    for (const state of ch.states) {
                        stateNameStore.store(this.itemIndexableContent(ds.id, state));
                    }
                });
                indexed[ds.id] = INDEX_VERSION;
                window.localStorage.setItem("indexedDatasets", JSON.stringify(indexed));
            }
        },
        index(force: boolean = false) {
            const dsStore = useDatasetStore();
            this.indexDataset(dsStore, force);
        },
    };
});