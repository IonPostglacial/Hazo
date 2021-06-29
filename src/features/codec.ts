import { isTopLevel, createHierarchicalItem, picturesFromPhotos, Book, BookInfo, Character, Dataset, DictionaryEntry, Field, Hierarchy, HierarchicalItem, IMap, Picture, State, Taxon } from "@/datatypes";
import { createCharacter } from "@/datatypes/Character";
import { standardBooks } from "@/datatypes/stdcontent";
import { createTaxon } from "@/datatypes/Taxon";
import { Description } from "@/datatypes/types";
import { ManyToManyBimap, OneToManyBimap } from "@/tools/bimaps";
import { CharactersHierarchy } from "../datatypes/CharactersHierarchy";

type EncodedState = {
	id: string;
	name: string;
	nameEN: string;
	nameCN: string;
	photos: Picture[];
	description?: string;
	color?: string;
};

export interface EncodedDataset {
	id: string
	taxons: ReturnType<typeof encodeTaxon>[];
	characters: ReturnType<typeof encodeCharacter>[];
	states: EncodedState[];
	books: Book[];
	extraFields: Field[];
	dictionaryEntries: Partial<Record<string, DictionaryEntry>>;
}

type EncodedCharacter = Omit<ReturnType<typeof encodeCharacter>, "photos"> & { photos: string[]|Picture[] };
type EncodedHierarchicalItem = Omit<ReturnType<typeof encodeHierarchicalItem>, "photos"> & { photos: string[]|Picture[] };
type EncodedDescription = { descriptorId: string, statesIds: string[] };

interface AlreadyEncodedDataset extends Omit<EncodedDataset, "characters"> {
	descriptors?: EncodedCharacter[]; // Legacy name of characters
	characters?:  EncodedCharacter[];
}

function encodeHierarchicalItem(hierarchy: Hierarchy<any>, item: HierarchicalItem) {
	const children = new Set<string>();

	for (const childId of hierarchy.childrenOf(item)) {
		children.add(childId);
	}
	return {
		id: item.id,
		type: item.type,
		parentId: item.parentId,
		topLevel: isTopLevel(item),
		children: [...children],
		name: item.name.S,
		nameEN: item.name.EN,
		nameCN: item.name.CN,
		photos: item.pictures,
		vernacularName: item.name.V,
	};
}

function encodeDescription(character: Character, states: State[]): EncodedDescription {
	return { descriptorId: character.id, statesIds: states.map(s => s.id) };
}

function encodeTaxon(taxon: Taxon, dataset: Dataset) {
	return {
		...encodeHierarchicalItem(dataset.taxonsHierarchy, taxon),
		bookInfoByIds: taxon.bookInfoByIds,
		specimenLocations: taxon.specimenLocations,
		descriptions: [...dataset.taxonDescriptions(taxon)].map(d => encodeDescription(d.character, d.states)),
		author: taxon.author,
		vernacularName2: taxon.vernacularName2,
		name2: taxon.name2,
		meaning: taxon.meaning,
		herbariumPicture: taxon.herbariumPicture,
		website: taxon.website,
		noHerbier: taxon.noHerbier,
		fasc: taxon.fasc,
		page: taxon.page,
		detail: taxon.detail,
		extra: taxon.extra,
	};
}

function encodeCharacter(dataset: Dataset, character: Character) {
	return {
		states: Array.from(dataset.charactersHierarchy.characterStates(character)).filter(s => typeof s !== "undefined").map(s => s.id),
		charType: character.charType,
		inherentStateId: character.inherentState?.id,
		inapplicableStatesIds: character.inapplicableStates.filter(s => typeof s !== "undefined").map(s => s.id),
		requiredStatesIds: character.requiredStates.filter(s => typeof s !== "undefined").map(s => s.id),
		...encodeHierarchicalItem(dataset.charactersHierarchy, character),
	};
}

function decodeState(encoded: EncodedState): State {
	return {
		id: encoded.id,
		name: {
			S: encoded.name,
			CN: encoded.nameCN,
			EN: encoded.nameEN,	
		},
		pictures: encoded.photos,
		description: encoded.description,
		color: encoded.color,		
	}
}

function encodeState(state: State): EncodedState {
	return {
		id: state.id,
		name: state.name.S,
		nameEN: state.name.EN ?? "",
		nameCN: state.name.CN ?? "",
		photos: state.pictures,
		description: state.description,
		color: state.color,
	};
}

export function encodeDataset(dataset: Dataset): EncodedDataset {
	const characters = dataset.charactersHierarchy.allItems;
	return {
		id: dataset.id,
		taxons: Array.from(dataset.taxonsHierarchy.allItems).map(taxon => encodeTaxon(taxon, dataset)),
		characters: Array.from(characters).map(character => encodeCharacter(dataset, character)),
		states: Array.from(dataset.charactersHierarchy.allStates).map(encodeState),
		books: dataset.books,
		extraFields: dataset.extraFields,
		dictionaryEntries: Object.fromEntries(dataset.dictionaryEntries.entries()),
	};
}

function decodeHierarchicalItem(item: EncodedHierarchicalItem): HierarchicalItem {
	return createHierarchicalItem({
		...item,
		name: {
			S: item.name,
			V: item.vernacularName,
			CN: item.nameCN,
			EN: item.nameEN,
			FR: item.name,
		},
		pictures: picturesFromPhotos(item.photos),
	});
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

	return createTaxon({
		...item,
		specimenLocations: encodedTaxon.specimenLocations,
		bookInfoByIds,
		author: encodedTaxon.author,
		vernacularName2: encodedTaxon.vernacularName2,
		name2: encodedTaxon.name2,
		meaning: encodedTaxon.meaning,
		herbariumPicture: encodedTaxon.herbariumPicture,
		website: encodedTaxon.website,
		noHerbier: encodedTaxon.noHerbier,
		fasc: encodedTaxon.fasc,
		page: encodedTaxon.page,
		detail : encodedTaxon.detail,
		extra: encodedTaxon.extra,
	});
}

function decodeCharacter(character: EncodedCharacter, states: IMap<State>): Character {
	const item = decodeHierarchicalItem(character);
	return createCharacter({
		...item,
		charType: character.charType,
		inherentState: typeof character.inherentStateId === "undefined" ? undefined : states.get(character.inherentStateId),
		inapplicableStates: character.inapplicableStatesIds?.map(id => states.get(id)!) ?? [],
		requiredStates: character.requiredStatesIds?.map(id => states.get(id)!) ?? [],
	});
}

export function decodeDataset(makeMap: { new(): IMap<any> }, dataset: AlreadyEncodedDataset|undefined): Dataset {
	const states: IMap<State> = new makeMap();
	const taxons = new Hierarchy<Taxon>("t", new makeMap());
	const books = standardBooks.slice();
	const statesByTaxons = new ManyToManyBimap(makeMap);
	const statesByCharacters = new OneToManyBimap(makeMap);
	const characters = new CharactersHierarchy("c", new makeMap(), states, statesByCharacters);
	const dictionaryEntries = new makeMap();
	const ds = new Dataset(
		dataset?.id ?? "0",
		taxons,
		characters,
		statesByTaxons,
		dictionaryEntries,
		books,
		dataset?.extraFields ?? [],
	);
	
	for (const state of dataset?.states ?? []) {
		states.set(state.id, decodeState(state));
	}
	for (const character of (dataset?.characters ?? dataset?.descriptors ?? [])) {
		characters.add(decodeCharacter(character, states));
		if (character.charType === "std" || !character.charType) {
			character.states.forEach(id => statesByCharacters.add(character.id, id));
		}
	}
	for (const taxon of dataset?.taxons ?? []) {
		taxon.descriptions.forEach(d => {
			for (const stateId of d.statesIds) {
				statesByTaxons.add(taxon.id, stateId);
			}
		});
		taxons.add(decodeTaxon(taxon, books));
	}
	for (const entry of Object.values(dataset?.dictionaryEntries ?? {})) {
		if (typeof entry !== "undefined") {
			dictionaryEntries.set(entry.id, entry);
		}
	}
	return ds;
}
