import { Character, Picture, Taxon, addTaxon, Dataset, Description, moveCharacterDown, moveCharacterUp, setState, taxonFromId, characterFromId, setTaxon, removeTaxon, changeTaxonParent, addCharacter, setCharacter, removeCharacter, setTaxonState, removeTaxonState, addState, removeAllCharacterStates, removeState, createDataset, createTaxon, createCharacter, standardBooks, Field, State, DiscreteCharacter, taxonDescriptions, taxonParentChain, allStates } from "@/datatypes";
import { defineStore } from "pinia";
import clone from '@/tools/clone';
import { EncodedDataset, createTexExporter, encodeDataset } from "@/features";
import saveSDD from "@/sdd-save";


export const useDatasetStore = defineStore("dataset", {
    state: (): Dataset => createDataset({ 
        id: "",
        taxonsHierarchy: createTaxon({ id: "t0", name: { S: "<TOP>" } }),
        charactersHierarchy: createCharacter({ id: "c0", name: { S: "<TOP>" } }),
        books: standardBooks,
        extraFields: new Array<Field>(),
        statesById: new Map(),
    }),
    actions: {
        taxonWithId(id: string | undefined): Taxon | undefined {
            return taxonFromId(this.$state, id);
        },
        taxonParentChain(id: string | undefined): Taxon[] {
            return taxonParentChain(this.$state, id);
        },
        createTexExporter() {
            return createTexExporter(this);
        },
        allStates(): Iterable<State> {
            return allStates(this);
        },
        addTaxon(taxon: Taxon): Taxon {
            return addTaxon(this.$state, taxon);
        },
        setTaxon({taxon, props} : {taxon: Taxon, props: Partial<Taxon>}) {
            setTaxon(this.$state, taxon.id, props);
        },
        addTaxons(taxons: Taxon[]) {
            taxons.forEach(t => this.addTaxon(t));
        },
        removeTaxon(taxon: Taxon) {
            removeTaxon(this.$state, taxon.id);
        },
        changeTaxonParent(e: { taxon: Taxon, newParentId: string }) {
            changeTaxonParent(this.$state, e.taxon.id, e.newParentId);
        },
        addTaxonPicture(payload: { taxon: Taxon, picture: Picture }) {
            const t = taxonFromId(this.$state, payload.taxon.id);
            if (t) t.pictures = [...t.pictures, payload.picture];
        },
        setTaxonPicture(payload: { taxon: Taxon, picture: Picture, index: number }) {
            const t = taxonFromId(this.$state, payload.taxon.id);
            if (t) {
                t.pictures[payload.index] = payload.picture;
                t.pictures = [...t.pictures];
            }
        },
        setTaxonLocations(payload: { taxon: Taxon, positions: { lat: number, lng: number }[] }) {
            const t = taxonFromId(this.$state, payload.taxon.id);
            if (t) t.specimenLocations = payload.positions;
        },
        removeTaxonPicture(payload: { taxon: Taxon, index: number }) {
            const t = taxonFromId(this.$state, payload.taxon.id);
            if (t) t.pictures.splice(payload.index, 1);
        },
        taxonDescriptions(taxon: Taxon): Array<Description> {
            return taxonDescriptions(this.$state, taxon);
        },
        characterWithId(id: string | undefined): Character | undefined {
            return characterFromId(this.$state, id);
        },
        addCharacter(character: Character): Character {
            return addCharacter(this.$state, character);
        },
        setCharacter({character, props} : {character: Character, props: Partial<Character>}) {
            setCharacter(this.$state, character.id, props);
        },
        addCharacters(characters: Character[]) {
            characters.forEach(c => this.addCharacter(c));
        },
        removeCharacter(character: Character) {
            removeCharacter(this.$state, character.id);
        },
        addCharacterPicture(payload: { character: Character, picture: Picture }) {
            const c = characterFromId(this.$state, payload.character.id);
            if (c) c.pictures = [...c.pictures, payload.picture];
        },
        setCharacterPicture(payload: { character: Character, picture: Picture, index: number }) {
            const c = characterFromId(this.$state, payload.character.id);
            if (c) {
                c.pictures[payload.index] = payload.picture;
                c.pictures = [...c.pictures];
            }
        },
        removeCharacterPicture(payload: { character: Character, index: number }) {
            const c = characterFromId(this.$state, payload.character.id);
            if (c) c.pictures.splice(payload.index, 1);
        },
        setDataset(dataset: Dataset) {
            this.$patch(dataset);
        },
        addState(payload: { state: State, character: DiscreteCharacter }): State {
            return addState(this.$state, payload.state, payload.character);
        },
        setStates(payload: { states: State[], character: DiscreteCharacter }) {
            const character = characterFromId(this.$state, payload.character.id);
            if (typeof character === "undefined" || character.characterType !== "discrete") { return; }
            removeAllCharacterStates(this.$state, character);
            payload.states.forEach(state => {
                this.addState({ state, character });
            });
        },
        moveTaxonUp(taxon: Taxon) {
            moveCharacterUp(this.taxonsHierarchy, this.taxonsByIds, taxon);
        },
        moveTaxonDown(taxon: Taxon) {
            moveCharacterDown(this.taxonsHierarchy, this.taxonsByIds, taxon);
        },
        moveCharacterUp(character: Character) {
            moveCharacterUp(this.charactersHierarchy, this.charactersByIds, character);
        },
        moveCharacterDown(character: Character) {
            moveCharacterDown(this.charactersHierarchy, this.charactersByIds, character);
        },
        moveStateUp(payload: { state: State, character: DiscreteCharacter }) {
            const c = characterFromId(this.$state, payload.character.id);
            const index = payload.character.states.findIndex(s => s.id === payload.state.id);
            if (index > 0 && c?.characterType === "discrete") {
                c.states[index] = c.states[index-1];
                c.states[index-1] = payload.state;
                c.states = [...c.states];
            }
        },
        moveStateDown(payload: { state: State, character: DiscreteCharacter }) {
            const c = characterFromId(this.$state, payload.character.id);
            const index = payload.character.states.findIndex(s => s.id === payload.state.id);
            if (index < payload.character.states.length - 1 && c?.characterType === "discrete") {
                c.states[index] = c.states[index+1];
                c.states[index+1] = payload.state;
                c.states = [...c.states];
            }
        },
        removeState(payload: { state: State, character: DiscreteCharacter }) {
            removeState(this.$state, payload.state, payload.character);
        },
        removeStates(payload: { states: State[], character: DiscreteCharacter }) {
            payload.states.forEach(state => {
                this.removeState({ state, character: payload.character });
            })
        },
        addStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, picture: Picture }) {
            const c = characterFromId(this.$state, payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c.states.find(s => s.id === payload.state.id);
                if (s) s.pictures = [...s.pictures, payload.picture];
            }
        },
        setStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, picture: Picture, index: number }) {
            const c = characterFromId(this.$state, payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c?.states.find(s => s.id === payload.state.id);
                if (s) {
                    s.pictures[payload.index] = payload.picture;
                    s.pictures = [...s.pictures];
                }
            }
        },
        removeStatePicture(payload: { character: DiscreteCharacter|undefined, state: State, index: number }) {
            const c = characterFromId(this.$state, payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c?.states.find(s => s.id === payload.state.id);
                if (s) s.pictures.splice(payload.index, 1);
            }
        },
        setInapplicableState(payload: { character: DiscreteCharacter, state: State, selected: boolean }) {
            setState(payload.character.inapplicableStates, payload.state, payload.selected);
            this.addCharacter(clone(payload.character));
        },
        setRequiredState(payload: { character: DiscreteCharacter, state: State, selected: boolean }) {
            setState(payload.character.requiredStates, payload.state, payload.selected);
            this.addCharacter(clone(payload.character));
        },
        setInherentState(payload: { character: DiscreteCharacter, state: State }) {
            const ch = characterFromId(this.$state, payload.character.id);
            if (ch?.characterType === "discrete") {
                ch.inherentState = payload.state;
                setState(ch.requiredStates, payload.state, false);
                setState(ch.inapplicableStates, payload.state, false);
            }
        },
        setTaxonState(p: { taxon: Taxon, state: State, has: boolean }) {
            if (p.has) {
                setTaxonState(this.$state, p.taxon.id, p.state);
            } else {
                removeTaxonState(this.$state, p.taxon.id, p.state);
            }
        },
        addExtraField({ detail }: { detail: string }) {
            this.extraFields.push({ id: detail, std: false, label: detail, icon: "" });
        },
        removeExtraField(id: string) {
            const i = this.extraFields.findIndex(f => f.id === id);
            if (i >= 0) {
                this.extraFields.splice(i, 1);
            }
        },
        resetData() {
            this.taxonsHierarchy = createTaxon({ id: "t0", name: { S: "<TOP>" } });
            this.charactersHierarchy = createCharacter({ id: "c0", name: { S: "<TOP>" } });
        },
        encodeToHazoJson(): EncodedDataset {
            return encodeDataset(this);
        },
        encodeToSdd(): Document {
            return saveSDD(this);
        },
    },
});