import { Item, Character, Hierarchy, Picture, Taxon, Dataset, Description, setState, createTaxon, createCharacter, standardBooks, Field, State, DiscreteCharacter, Measurement, forEachLeaves, iterHierarchy, forEachHierarchy, createInherentState } from "@/datatypes";
import { addTaxon, createDataset, moveCharacterDown, moveCharacterUp, taxonFromId, characterFromId, setTaxon, removeTaxon, changeTaxonParent, addCharacter, setCharacter, removeCharacter, setTaxonState, removeTaxonState, addState, removeAllCharacterStates, removeState, taxonDescriptions, taxonParentChain, allStates, taxonCharactersTree, pathToItem, taxonDescriptorSections, characterParentChain } from "@/datatypes/Dataset";
import { defineStore } from "pinia";
import clone from '@/tools/clone';
import { EncodedDataset, createTexExporter, encodeDataset } from "@/features";
import saveSDD from "@/sdd-save";
import { Track } from "@/components/Flowering.vue";
import Months from "@/datatypes/Months";
import { datasetToCsvZip } from "@/features/relationalexport";

const palette = ["#84bf3d", "red", "blue", "orange", "purple"];

export const useDatasetStore = defineStore("dataset", {
    state: (): Dataset => createDataset({ 
        id: "",
        taxonsHierarchy: createTaxon({ id: "t0", path: [], name: { S: "<TOP>" } }),
        charactersHierarchy: createCharacter({ id: "c0", path: [], name: { S: "<TOP>" } }),
        books: standardBooks,
        extraFields: new Array<Field>(),
        statesById: new Map(),
    }),
    getters: {
        leafTaxons(): Taxon[] {
            const items: Taxon[] = [];
            forEachLeaves(this.taxonsHierarchy, t => {
                items.push(t);
            });
            return items;
        },
        allTaxons(): Taxon[] {
            const items: Taxon[] = [];
            forEachHierarchy(this.taxonsHierarchy, t => {
                items.push(t);
            });
            return items;
        },
        allCharacters(): Character[] {
            const items: Character[] = [];
            forEachHierarchy(this.charactersHierarchy, t => {
                items.push(t);
            });
            return items;
        },
        numberOfCharacters(): number {
            let count = -1;
            forEachHierarchy(this.charactersHierarchy, _ => {
                count++;
            });
            return count;
        }
    },
    actions: {
        taxonWithId(id: string | undefined): Taxon | undefined {
            return taxonFromId(this.$state, id);
        },
        taxonChildren(taxon: Taxon): Generator<Taxon> {
            return iterHierarchy(taxon);
        },
        hasChildren(taxon: Taxon): boolean {
            return taxon.children.length > 0;
        },
        taxonParentChain(id: string | undefined): Taxon[] {
            return taxonParentChain(this.$state, id);
        },
        taxonCharactersTree(taxon: Taxon, charactersHierarchy: Hierarchy<Character>): Hierarchy<Item> {
            return taxonCharactersTree(taxon, charactersHierarchy);
        },
        createTexExporter() {
            return createTexExporter(this.taxonsHierarchy, t => this.taxonDescriptions(t));
        },
        allStates(): Iterable<State> {
            return allStates(this);
        },
        addTaxon(taxon: Taxon): Taxon {
            this.$patch((ds) => {
                taxon = addTaxon(ds, taxon);
            });
            return taxon;
        },
        setTaxon({taxon, props} : {taxon: Taxon, props: Partial<Taxon>}) {
            this.$patch((ds) => {
                setTaxon(ds, taxon.id, props);
            });
        },
        addTaxons(taxons: Taxon[]) {
            this.$patch((ds) => {
                taxons.forEach(t => addTaxon(ds, t));
            });
        },
        removeTaxon(taxon: { id: string } |undefined) {
            if (typeof taxon === "undefined") { return; }
            this.$patch((ds) => {
                removeTaxon(ds, taxon.id);
            });
        },
        changeTaxonParent(e: { taxon: Taxon, newParentId: string }) {
            this.$patch((ds) => {
                changeTaxonParent(ds, e.taxon.id, e.newParentId);
            });
        },
        updateTaxonMeasurement(payload: { taxon: Taxon, character: string, measurement: Measurement }) {
            const t = taxonFromId(this.$state, payload.taxon.id);
            if (t) {
                t.measurements = { ...t.measurements, [payload.character]: payload.measurement };
            }
        },
        addTaxonPicture(payload: { taxon: Taxon, picture: Picture }) {
            const t = taxonFromId(this.$state, payload.taxon.id);
            if (t) {
                payload.picture.path = pathToItem(t);
                t.pictures = [...t.pictures, payload.picture];
            }
        },
        setTaxonPicture(payload: { taxon: Taxon, picture: Picture, index: number }) {
            const t = taxonFromId(this.$state, payload.taxon.id);
            if (t) {
                payload.picture.path = pathToItem(t);
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
        taxonDescriptions(taxon: Taxon|undefined): Array<Description> {
            if (typeof taxon === "undefined") { return []; }
            return taxonDescriptions(this.$state, taxon);
        },
        taxonDescriptionSections(taxon: Taxon|undefined, filter?: (ch: Character) => boolean): Array<Array<Description|Measurement>> {
            if (typeof taxon === "undefined") { return []; }
            return taxonDescriptorSections(this.$state, taxon, filter);
        },
        itemFloweringDescription(taxon: Taxon): Description[] {
            return this.taxonDescriptions(taxon)
                .filter(
                    desc => desc.character.characterType === "discrete" && 
                    desc.character.preset === "flowering"
                );
        },
        taxonCalendarTracks(taxon: Taxon): Track[] {
            const tracks: Track[] = [];
            let color = 0;
            for (const desc of this.itemFloweringDescription(taxon)) {
                if (desc.character.characterType !== "discrete" || desc.character.preset !== "flowering") {
                    continue;
                }
                tracks.push({
                    name: desc.character.name.S,
                    color: desc.character.color ?? palette[color++],
                    data: Months.fromStates(desc.states),
                });
                if (color >= palette.length) { color = 0; }
            }
            return tracks;
        },
        characterWithId(id: string | undefined): Character | undefined {
            return characterFromId(this.$state, id);
        },
        characterParentChain(id: string | undefined): Character[] {
            return characterParentChain(this.$state, id);
        },
        characterTree(character: Character): Generator<Character> {
            return iterHierarchy(character);
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
        removeCharacter(character: { id: string } |undefined) {
            if (typeof character === "undefined") { return; }
            removeCharacter(this.$state, character.id);
        },
        addCharacterPicture(payload: { character: Character, picture: Picture }) {
            const c = characterFromId(this.$state, payload.character.id);
            if (c) {
                payload.picture.path = pathToItem(c);
                c.pictures = [...c.pictures, payload.picture];
            }
        },
        setCharacterPicture(payload: { character: Character, picture: Picture, index: number }) {
            const c = characterFromId(this.$state, payload.character.id);
            if (c) {
                payload.picture.path = pathToItem(c);
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
        addStatePicture(payload: { character: Character|undefined, state: State, picture: Picture }) {
            const c = characterFromId(this.$state, payload.character?.id);
            if (c?.characterType === "discrete") {
                const s = c.states.find(s => s.id === payload.state.id);
                if (s) s.pictures = [...s.pictures, payload.picture];
            }
        },
        setStatePicture(payload: { character: Character|undefined, state: State, picture: Picture, index: number }) {
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
            if (ch?.characterType !== "discrete") {
                console.warn("could not set inherent state for", payload.character.id);
                return;
            }
            ch.inherentState = payload.state;
            setState(ch.requiredStates, payload.state, false);
            setState(ch.inapplicableStates, payload.state, false);
            setCharacter(this.$state, ch.id, ch);
        },
        setTaxonState(p: { taxon: Taxon, state: State, has: boolean }) {
            if (p.has) {
                setTaxonState(this.$state, p.taxon.id, p.state);
            } else {
                removeTaxonState(this.$state, p.taxon.id, p.state);
            }
        },
        setTaxonCharacter(p: { taxon: Taxon, character: DiscreteCharacter, has: boolean }) {
            let state = p.character.inherentState;
            if (typeof state === "undefined") {
                state = this.addState({ state: createInherentState(p.character), character: p.character });
                this.setInherentState({ character: p.character, state });
            }
            this.setTaxonState({ taxon: p.taxon, state, has: p.has });
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
            this.taxonsHierarchy = createTaxon({ id: "t0", path: [], name: { S: "<TOP>" } });
            this.charactersHierarchy = createCharacter({ id: "c0", path: [], name: { S: "<TOP>" } });
        },
        encodeToHazoJson(): EncodedDataset {
            return encodeDataset(this);
        },
        encodeToSdd(): Document {
            return saveSDD(this);
        },
        encodeToCsvZip(): Promise<Blob> {
            return datasetToCsvZip(this.encodeToHazoJson());
        },
    },
});