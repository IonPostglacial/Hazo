import { Book, BookInfo, Character, Dataset, DetailData, DictionaryEntry, Field, HierarchicalItem, Picture, State, Taxon } from "./datatypes";
import { standardBooks } from "./stdcontent";
import { createDataset } from "./Dataset";
import { createDetailData } from './DetailData';
import { createHierarchicalItem } from './HierarchicalItem';
import { createTaxon, taxonDescriptions } from './Taxon';
import { createCharacter } from './Character';

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

function encodeTaxon(taxon: Taxon, characters: Iterable<Character>) {
	return {
		bookInfoByIds: taxon.bookInfoByIds,
		descriptions: taxonDescriptions(taxon, characters).map(d => encodeDescription(d.character.id, d.states.map(s => s.id))),
		...encodeHierarchicalItem(taxon),
	};
}

function encodeCharacter(character: Character) {
	return {
		states: character.states.map(s => s.id),
		inapplicableStatesIds: character.inapplicableStates.map(s => s.id),
		requiredStatesIds: character.requiredStates.map(s => s.id),
		...encodeHierarchicalItem(character),
	};
}

function getAllStates(dataset: Dataset): State[] {
	let states: State[] = [];
	for (const character of Object.values(dataset.characters)) {
		states = states.concat(character.states);
	}
	return states;
}

export function encodeDataset(dataset: Dataset): EncodedDataset {
	const characters = Object.values(dataset.characters);
	return {
		id: dataset.id,
		taxons: Object.values(dataset.taxons).map(taxon => encodeTaxon(taxon, characters)),
		characters: characters.map(character => encodeCharacter(character)),
		states: getAllStates(dataset),
		books: dataset.books,
		extraFields: dataset.extraFields,
		dictionaryEntries: dataset.dictionaryEntries,
	};
}

function decodeHierarchicalItem<T>(item: EncodedHierarchicalItem): HierarchicalItem<T> {
	return createHierarchicalItem({...item, childrenIds: item.children});
}

function decodeTaxon(encodedTaxon: ReturnType<typeof encodeTaxon>, characters: Record<string, Character>, states: Record<string, State>, books: Book[]): Taxon {
	const bookInfoByIds = (typeof encodedTaxon.bookInfoByIds !== "undefined") ? encodedTaxon.bookInfoByIds : {};

	if (Object.keys(bookInfoByIds).length === 0) {
		for (const book of standardBooks) {
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
		statesSelection: statesSelection,
		bookInfoByIds,
	});
}

function decodeCharacter(character: EncodedCharacter, states: Record<string, State>): Character {
	const item = decodeHierarchicalItem(character);
	return createCharacter({
		...item,
		childrenIds: item.childrenOrder ?? [],
		states: character.states.map(id => states[id]),
		inapplicableStates: character.inapplicableStatesIds?.map(id => states[id]) ?? [],
		requiredStates: character.requiredStatesIds?.map(id => states[id]) ?? [],
	});
}

export function decodeDataset(dataset: AlreadyEncodedDataset): Dataset {
	const states: Record<string, State> = {};
	const characters: Record<string, Character> = {};
	const taxons: Record<string, Taxon> = {};
	const books = standardBooks.slice();

	for (const state of dataset.states) {
		states[state.id] = state;
	}
	for (const character of (dataset.characters ?? dataset.descriptors ?? [])) {
		characters[character.id] = decodeCharacter(character, states);
	}
	for (const taxon of dataset.taxons) {
		taxons[taxon.id] = decodeTaxon(taxon, characters, states, books);
	}
	return createDataset(
		dataset.id,
		taxons,
		characters,
		books,
		dataset.extraFields,
		dataset.dictionaryEntries,
	);
}
