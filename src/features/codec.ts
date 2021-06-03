import { Book, BookInfo, Character, Dataset, DetailData, DictionaryEntry, Field, Hierarchy, HierarchicalItem, IMap, Picture, State, Taxon } from "@/datatypes";
import { standardBooks } from "@/datatypes/stdcontent";
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

interface AlreadyEncodedDataset extends Omit<EncodedDataset, "characters"> {
	descriptors?: EncodedCharacter[]; // Legacy name of characters
	characters?:  EncodedCharacter[];
}

function encodeHierarchicalItem(hierarchy: Hierarchy<any>, item: HierarchicalItem<any>) {
	const children = new Set<string>();

	for (const childId of hierarchy.childrenOf(item)) {
		children.add(childId);
	}
	return {
		id: item.id,
		type: item.type,
		parentId: item.parentId,
		topLevel: item.topLevel,
		children: [...children],
		name: item.name.S,
		nameEN: item.name.EN,
		nameCN: item.name.CN,
		photos: item.pictures,
		author: item.author,
		vernacularName: item.name.V,
		vernacularName2: item.vernacularName2,
		name2: item.name2,
		meaning: item.meaning,
		herbariumPicture: item.herbariumPicture,
		website: item.website,
		noHerbier: item.noHerbier,
		fasc: item.fasc,
		page: item.page,
		detail: item.detail,
		extra: item.extra,
	};
}

function encodeDescription(descriptorId: string, statesIds: string[]) {
	return { descriptorId, statesIds };
}

function encodeTaxon(taxon: Taxon, dataset: Dataset) {
	return {
		bookInfoByIds: taxon.bookInfoByIds,
		specimenLocations: taxon.specimenLocations,
		descriptions: [...dataset.taxonDescriptions(taxon)].map(d => encodeDescription(d.character.id, d.states.map(s => s.id))),
		...encodeHierarchicalItem(dataset.taxonsHierarchy, taxon),
	};
}

function encodeCharacter(dataset: Dataset, character: Character) {
	return {
		states: Array.from(dataset.charactersHierarchy.characterStates(character)).filter(s => typeof s !== "undefined").map(s => s.id),
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

function decodeHierarchicalItem(item: EncodedHierarchicalItem): HierarchicalItem<any> {
	return new HierarchicalItem({
		...item,
		name: {
			S: item.name,
			V: item.vernacularName,
			CN: item.nameCN,
			EN: item.nameEN,
			FR: item.name,
		},
		pictures: item.photos,
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
	const statesSelection: Record<string, boolean> = {};
    for (const description of encodedTaxon.descriptions) {
        for (const stateId of description.statesIds) {
            statesSelection[stateId] = true;
        }
    }
	return new Taxon({
		...item,
		specimentLocations: encodedTaxon.specimenLocations,
		bookInfoByIds,
	});
}

function decodeCharacter(character: EncodedCharacter, states: IMap<State>): Character {
	const item = decodeHierarchicalItem(character);
	return new Character({
		...item,
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
	
	for (const state of dataset?.states ?? []) {
		states.set(state.id, decodeState(state));
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
	const dictionaryEntries = new makeMap();
	for (const entry of Object.values(dataset?.dictionaryEntries ?? {})) {
		if (typeof entry !== "undefined") {
			dictionaryEntries.set(entry.id, entry);
		}
	}
	return new Dataset(
		dataset?.id ?? "0",
		taxons,
		characters,
		statesByTaxons,
		dictionaryEntries,
		books,
		dataset?.extraFields ?? [],
	);
}
