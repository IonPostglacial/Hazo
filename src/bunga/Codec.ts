import { Book, BookInfo, Character, Dataset, DetailData, HierarchicalItem, State, Taxon } from "./datatypes";
import { standardBooks } from "./stdcontent";
import { createDataset } from "./Dataset";
import { createDetailData } from './DetailData';
import { createHierarchicalItem, hydrateChildren } from './HierarchicalItem';
import { createTaxon } from './Taxon';
import { createCharacter } from './Character';

function encodeHierarchicalItem<T extends DetailData>(item: HierarchicalItem<T>) {
	const children = [];

	for (const child of Object.values(item.children)) {
		if (typeof child === "undefined" || child === null) {
			console.log(item.name + " has null child");
			console.log(item);
		} else {
			children.push(child.id);
		}
	}
	return {
		type: item.type,
		parentId: item.parentId,
		topLevel: item.topLevel,
		children: children,
		...createDetailData(item),
	};
}

function encodeDescription(descriptorId: string, statesIds: string[]) {
	return { descriptorId, statesIds };
}

function encodeTaxon(taxon: Taxon) {
	return {
		bookInfoByIds: taxon.bookInfoByIds,
		descriptions: taxon.descriptions.map(d => encodeDescription(d.descriptor.id, d.states.map(s => s.id))),
		...encodeHierarchicalItem(taxon),
	};
}

function encodeCharacter(character: Character) {
	return {
		states: character.states.map(s => s.id),
		inapplicableStatesIds: character.inapplicableStates.map(s => s.id),
		...encodeHierarchicalItem(character),
	};
}

function getAllStates(dataset: Dataset): State[] {
	let states: State[] = [];
	for (const character of Object.values(dataset.descriptors)) {
		states = states.concat(character.states);
	}
	return states;
}

export function encodeDataset(dataset: Dataset) {
	return {
		id: dataset.id,
		taxons: Object.values(dataset.taxons).map(taxon => encodeTaxon(taxon)),
		descriptors: Object.values(dataset.descriptors).map(character => encodeCharacter(character)),
		states: getAllStates(dataset),
		books: dataset.books,
		extraFields: dataset.extraFields,
		dictionaryEntries: dataset.dictionaryEntries,
	};
}

function decodeHierarchicalItem<T>(item: ReturnType<typeof encodeHierarchicalItem>): HierarchicalItem<T> {
	return createHierarchicalItem({...item, childrenIds: item.children});
}

function decodeTaxon(taxon: ReturnType<typeof encodeTaxon>, descriptions: Record<string, Character>, states: Record<string, State>, books: Book[]): Taxon {
	const bookInfoByIds = (typeof taxon.bookInfoByIds !== "undefined") ? taxon.bookInfoByIds : {};

	if (Object.keys(bookInfoByIds).length === 0) {
		for (const book of standardBooks) {
			const info:BookInfo = {
				fasc: (book.id === "fmc") ? "" + taxon.fasc : "",
				page: (book.id === "fmc") ? taxon.page : undefined,
				detail: ""
			};
			bookInfoByIds[book.id] = info;
		}
	}
	const item = decodeHierarchicalItem(taxon);
	return createTaxon({
		...item,
		childrenIds: item.childrenOrder,
		descriptions: taxon.descriptions.map(function(d) { return {
			descriptor: descriptions[d.descriptorId],
			states: d.statesIds.map(id => states[id]),
		}}),
		bookInfoByIds,
	});
}

function decodeCharacter(character: ReturnType<typeof encodeCharacter>, states: Record<string, State>): Character {
	const item = decodeHierarchicalItem(character);
	return createCharacter({
		...item,
		childrenIds: item.childrenOrder,
		states: character.states.map(id => states[id]),
		inapplicableStates: character.inapplicableStatesIds?.map(id => states[id]) ?? [],
		
	});
}

export function decodeDataset(dataset: ReturnType<typeof encodeDataset>): Dataset {
	const states: Record<string, State> = {};
	const descriptors: Record<string, Character> = {};
	const taxons: Record<string, Taxon> = {};
	const books = standardBooks.slice();

	for (const state of dataset.states) {
		states[state.id] = state;
	}
	for (const descriptor of dataset.descriptors) {
		descriptors[descriptor.id] = decodeCharacter(descriptor, states);
	}
	for (const taxon of dataset.taxons) {
		taxons[taxon.id] = decodeTaxon(taxon, descriptors, states, books);
	}
	for (const descriptor of Object.values(descriptors)) {
		hydrateChildren(descriptor, descriptors);
	}
	for (const taxon of Object.values(taxons)) {
		hydrateChildren(taxon, taxons);
	}
	return createDataset(
		dataset.id,
		taxons,
		descriptors,
		books,
		dataset.extraFields,
		dataset.dictionaryEntries,
	);
}
