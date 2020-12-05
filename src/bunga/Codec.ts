import { Book, BookInfo, Character, DetailData, DictionaryEntry, Field, HierarchicalItem, Picture, State, Taxon } from "./datatypes";
import { standardBooks } from "./stdcontent";
import { Dataset } from "./Dataset";
import { createDetailData } from "./DetailData";
import { createHierarchicalItem } from "./HierarchicalItem";
import { createTaxon } from "./Taxon";
import { createCharacter } from "./Character";
import { ManyToManyBimap, OneToManyBimap } from "@/tools/bimaps";
import { Hierarchy, IMap } from "./hierarchy";
import { CharactersHierarchy } from "./CharactersHierarchy";

export interface EncodedDataset {
	id: string
	taxons: ReturnType<typeof encodeTaxon>[];
	characters: ReturnType<typeof encodeCharacter>[];
	states: State[];
	books: Book[];
	extraFields: Field[];
	dictionaryEntries: DictionaryEntry[]|Record<string, DictionaryEntry>;
}

type EncodedCharacter = Omit<ReturnType<typeof encodeCharacter>, "photos"> & { photos: string[]|Picture[] };
type EncodedHierarchicalItem = Omit<ReturnType<typeof encodeHierarchicalItem>, "photos"> & { photos: string[]|Picture[] };

interface AlreadyEncodedDataset extends Omit<EncodedDataset, "characters"> {
	descriptors?: EncodedCharacter[]; // Legacy name of characters
	characters?:  EncodedCharacter[];
}

function encodeHierarchicalItem<T extends DetailData>(item: HierarchicalItem<T>) {
	const children = new Set<string>();

	for (const childId of item.childrenOrder ?? []) {
		children.add(childId);
	}
	return {
		type: item.type,
		parentId: item.parentId,
		topLevel: item.topLevel,
		children: [...children],
		...createDetailData(item),
	};
}

function encodeDescription(descriptorId: string, statesIds: string[]) {
	return { descriptorId, statesIds };
}

function encodeTaxon(taxon: Taxon, dataset: Dataset) {
	return {
		bookInfoByIds: taxon.bookInfoByIds,
		descriptions: [...dataset.taxonDescriptions(taxon)].map(d => encodeDescription(d.character.id, d.states.map(s => s.id))),
		...encodeHierarchicalItem(taxon),
	};
}

function encodeCharacter(dataset: Dataset, character: Character) {
	return {
		states: Array.from(dataset.characterStates(character)).filter(s => typeof s !== "undefined").map(s => s.id),
		inherentStateId: character.inherentState?.id,
		inapplicableStatesIds: character.inapplicableStates.filter(s => typeof s !== "undefined").map(s => s.id),
		requiredStatesIds: character.requiredStates.filter(s => typeof s !== "undefined").map(s => s.id),
		...encodeHierarchicalItem(character),
	};
}

export function encodeDataset(dataset: Dataset): EncodedDataset {
	const characters = dataset.charactersHierarchy.allItems;
	return {
		id: dataset.id,
		taxons: Array.from(dataset.taxonsHierarchy.allItems).map(taxon => encodeTaxon(taxon, dataset)),
		characters: Array.from(characters).map(character => encodeCharacter(dataset, character)),
		states: Object.values(dataset.states).filter(s => typeof s !== "undefined") as State[],
		books: dataset.books,
		extraFields: dataset.extraFields,
		dictionaryEntries: dataset.dictionaryEntries,
	};
}

function decodeHierarchicalItem<T>(item: EncodedHierarchicalItem): HierarchicalItem<T> {
	return createHierarchicalItem({...item, childrenIds: item.children});
}

function decodeTaxon(encodedTaxon: ReturnType<typeof encodeTaxon>, books: Book[]): Taxon {
	const bookInfoByIds = (typeof encodedTaxon.bookInfoByIds !== "undefined") ? encodedTaxon.bookInfoByIds : {};

	if (Object.keys(bookInfoByIds).length === 0) {
		for (const book of books) {
			const info:BookInfo = {
				fasc: (book.id === "fmc") ? "" + encodedTaxon.fasc : "",
				page: (book.id === "fmc") ? encodedTaxon.page : undefined,
				detail: ""
			};
			bookInfoByIds[book.id] = info;
		}
	}
	const item = decodeHierarchicalItem(encodedTaxon);
	const statesSelection: Record<string, boolean> = {};
    for (const description of encodedTaxon.descriptions) {
        for (const stateId of description.statesIds) {
            statesSelection[stateId] = true;
        }
    }
	return createTaxon({
		...item,
		childrenIds: item.childrenOrder ?? [],
		bookInfoByIds,
	});
}

function decodeCharacter(character: EncodedCharacter, states: Record<string, State>): Character {
	const item = decodeHierarchicalItem(character);
	return createCharacter({
		...item,
		childrenIds: item.childrenOrder ?? [],
		inherentState: typeof character.inherentStateId === "undefined" ? undefined : states[character.inherentStateId],
		inapplicableStates: character.inapplicableStatesIds?.map(id => states[id]) ?? [],
		requiredStates: character.requiredStatesIds?.map(id => states[id]) ?? [],
	});
}

export function decodeDataset(makeMap: { new(): IMap<any> }, dataset: AlreadyEncodedDataset|undefined): Dataset {
	const states: Record<string, State> = {};
	const characters = new CharactersHierarchy("c", new makeMap());
	const taxons = new Hierarchy("t", new makeMap());
	const books = standardBooks.slice();
	const statesByTaxons = new ManyToManyBimap(makeMap);
	const statesByCharacters = new OneToManyBimap(makeMap);

	for (const state of dataset?.states ?? []) {
		states[state.id] = state;
	}
	for (const character of (dataset?.characters ?? dataset?.descriptors ?? [])) {
		characters.add(decodeCharacter(character, states));
		character.states.forEach(id => statesByCharacters.add(character.id, id));
	}
	for (const taxon of dataset?.taxons ?? []) {
		taxon.descriptions.forEach(d => {
			for (const stateId of d.statesIds) {
				statesByTaxons.add(taxon.id, stateId);
			}
		});
		taxons.add(decodeTaxon(taxon, books));
	}
	return new Dataset(
		dataset?.id ?? "0",
		taxons,
		characters,
		states,
		statesByTaxons,
		statesByCharacters,
		books,
		dataset?.extraFields ?? [],
		dataset?.dictionaryEntries ?? {},
	);
}
