import { defineStore, mapActions } from "pinia";
import { Character, DictionaryEntry, Hierarchy, Taxon, cloneHierarchy, State, forEachHierarchy } from "../datatypes";
import clone from "../tools/clone";
import makeid from '../tools/makeid';
import { fixParentIds } from "../tools/fixes";
import { useDatasetStore } from "./dataset";
import { Dataset } from "../datatypes";
import { characterNameStore, familyNameStore, stateNameStore } from "@/db-index";

export const useHazoStore = defineStore("hazo", {
    state: () => ({
        selectedTaxon: undefined as string|undefined,
        selectedCharacter: undefined as string|undefined,
        dictionary: { entries: new Array<DictionaryEntry>() },
        connectedToHub: false,
        copiedTaxon: null as null | Hierarchy<Taxon>,
        copiedCharacter: null as null | Hierarchy<Character>,
        copiedStates: [] as State[],
        statesAllowList: [] as State[],
        statesDenyList: [] as State[],
    }),
    getters: {
        indexedDatasets(): string[] {
            const ids = window.localStorage.getItem("indexedDatasets");
            if (ids) {
                try {
                    return JSON.parse(ids);
                } catch (e) {
                    console.error(e);
                }
            }
            return [];
        }
    },
    actions: {
        ...mapActions(useDatasetStore, ["addCharacter", "addTaxon", "addState", "characterWithId"]),
        addStateToAllowList(state: State) {
            this.statesAllowList = [...this.statesAllowList, state];
        },
        removeStateFromAllowList(state: State) {
            this.statesAllowList = this.statesAllowList.filter(s => s.id !== state.id);
        },
        addStateToDenyList(state: State) {
            this.statesDenyList = [...this.statesDenyList, state];
        },
        removeStateFromDenyList(state: State) {
            this.statesDenyList = this.statesDenyList.filter(s => s.id !== state.id);
        },
        setConnectedToHub(connectedToHub: boolean) {
            this.connectedToHub = connectedToHub;
        },
        selectTaxon(taxon: Taxon) {
            this.selectedTaxon = taxon.id;
        },
        selectCharacter(character: Character) {
            this.selectedCharacter = character.id;
        },
        unselectTaxon() {
            this.selectedTaxon = "";
            this.router.push("/taxons");
        },
        unselectCharacter() {
            this.selectedCharacter = "";
            this.router.push("/characters");
        },
        copyTaxon(taxon: Taxon) {
            this.copiedTaxon = cloneHierarchy(taxon);
        },
        copyCharacter(character: Character) {
            const clonedCharacter = cloneHierarchy(character);
            clonedCharacter.requiredStates = clone(clonedCharacter.requiredStates);
            clonedCharacter.inapplicableStates = clone(clonedCharacter.inapplicableStates);
            if (clonedCharacter.characterType === "discrete") {
                clonedCharacter.states = clone(clonedCharacter.states);
                clonedCharacter.inherentState = clone(clonedCharacter.inherentState);
            }
            this.copiedCharacter = clonedCharacter;
        },
        copyStates(states: State[] | undefined) {
            if (typeof states !== "undefined") {
                this.copiedStates = clone(states);
                this.copiedStates.forEach(s => s.id = "s-" + makeid(8));
            }
        },
        pasteTaxon(targetId: string) {
            if (this.copiedTaxon !== null) {
                const taxon = cloneHierarchy(this.copiedTaxon);
                taxon.parentId = targetId;
                fixParentIds(taxon);
                this.addTaxon(taxon);
            }
        },
        pasteCharacter(targetId: string) {
            if (this.copiedCharacter === null) return;
            const character = cloneHierarchy(this.copiedCharacter);
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
                    this.addState({ state: newState, character });
                    if (oldRequiredStatesIds.includes(oldState.id)) {
                        character.requiredStates.push(newState);
                    }
                    if (oldInapplicableStatesIds.includes(oldState.id)) {
                        character.inapplicableStates.push(newState);
                    }
                }
            }
            const newParent = this.characterWithId(targetId);
            if (newParent?.characterType === "discrete" && this.copiedCharacter?.characterType === "discrete") {
                if (newParent && this.copiedCharacter?.inherentState?.id) {
                    this.copiedCharacter.inherentState.id = "s-auto-" + this.copiedCharacter.id;
                    newParent.states.push(this.copiedCharacter.inherentState);
                }
            }
            character.parentId = targetId;
            fixParentIds(character);
            this.addCharacter(character);
        },
        pasteStates(characterId: string) {
            for (const s of this.copiedStates) {
                const stateToAdd = clone(s);
                const character = this.characterWithId(characterId);
                if (typeof character !== "undefined" && character.characterType === "discrete") {
                    this.addState({ state: stateToAdd, character });
                }
            }
        },
        indexDataset(ds: Dataset) {
            const indexed = this.indexedDatasets;
            if (!indexed.includes(ds.id)) {
                for (const family of ds.taxonsHierarchy.children) {
                    familyNameStore.store({ origin: ds.id, name: { 
                        S: family.name.S, 
                        V: family.name.V ?? "", 
                        EN: family.name.EN ?? "",
                        FR: family.name.FR ?? "",
                        CN: family.name.CN ?? "" ,
                    } });
                }
                forEachHierarchy(ds.charactersHierarchy, ch => {
                    if (ch.id === "c0") { return; }
                    characterNameStore.store({ origin: ds.id, name: { 
                        S: ch.name.S,
                        V: ch.name.V ?? "",
                        EN: ch.name.EN ?? "",
                        FR: ch.name.FR ?? "", 
                        CN: ch.name.CN ?? "",
                    } });
                });
                forEachHierarchy(ds.charactersHierarchy, ch => {
                    if (ch.id === "c0" || ch.characterType !== "discrete") { return; }
                    for (const state of ch.states) {
                        stateNameStore.store({ origin: ds.id, 
                            name: { 
                                S: state.name.S,
                                V: ch.name.V ?? "",
                                EN: state.name.EN ?? "",
                                FR: state.name.FR ?? "", 
                                CN: state.name.CN ?? "" } 
                            });
                    }
                });
                indexed.push(ds.id);
                window.localStorage.setItem("indexedDatasets", JSON.stringify(indexed));
            }
        },
        index() {
            const dsStore = useDatasetStore();
            this.indexDataset(dsStore);
        },
    },
});