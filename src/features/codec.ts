import { isTopLevel, createHierarchicalItem, picturesFromPhotos, Book, BookInfo, Character, Dataset, DictionaryEntry, Field, Hierarchy, HierarchicalItem, IMap, Picture, State, Taxon } from "@/datatypes";
import { createCharacter, CharacterPreset } from "@/datatypes";
import { standardBooks } from "@/datatypes/stdcontent";
import { createTaxon } from "@/datatypes/Taxon";
import { ManyToManyBimap, OneToManyBimap } from "@/tools/bimaps";
import { map } from "@/tools/iter";
import clone from "@/tools/clone";

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

function deduplicatePicsIds(pictures: Iterable<Picture>, picIds: Set<string>) {
	const pics = new Array<Picture>();
	for (const pic of pictures) {
		const newPic = clone(pic);
		if (picIds.has(pic.id)) {
			let newId = picIds.size;
			while (picIds.has("m"+newId)) {
				newId++;
			}
			newPic.id = "m"+newId;
		}
		picIds.add(newPic.id);
		pics.push(newPic);
	}
	return pics;
}

function encodeHierarchicalItem(hierarchy: Hierarchy<any>, item: HierarchicalItem, picIds: Set<string>) {
	const children = new Set<string>();

	for (const child of hierarchy.childrenOf(item)) {
		children.add(child.id);
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
		photos: deduplicatePicsIds(item.pictures, picIds),
		vernacularName: item.name.V,
	};
}

function encodeDescription(character: Character, states: State[]): EncodedDescription {
	return { descriptorId: character.id, statesIds: states.map(s => s.id) };
}

function encodeTaxon(taxon: Taxon, dataset: Dataset, picIds: Set<string>) {
	return {
		...encodeHierarchicalItem(dataset.taxonsHierarchy, taxon, picIds),
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

function encodeCharacter(dataset: Dataset, character: Character, picIds: Set<string>) {
	return {
		states: Array.from(dataset.characterStates(character)).filter(s => typeof s !== "undefined").map(s => s.id),
		preset: character.preset,
		inherentStateId: character.inherentState?.id,
		inapplicableStatesIds: character.inapplicableStates.filter(s => typeof s !== "undefined").map(s => s.id),
		requiredStatesIds: character.requiredStates.filter(s => typeof s !== "undefined").map(s => s.id),
		...encodeHierarchicalItem(dataset.charactersHierarchy, character, picIds),
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

function encodeState(state: State, picIds: Set<string>): EncodedState {
	return {
		id: state.id,
		name: state.name.S,
		nameEN: state.name.EN ?? "",
		nameCN: state.name.CN ?? "",
		photos: deduplicatePicsIds(state.pictures, picIds),
		description: state.description,
		color: state.color,
	};
}

export function encodeDataset(dataset: Dataset): EncodedDataset {
	const characters = dataset.charactersHierarchy.allItems;
	const allStates = new Map<string, State>();
	const picIds = new Set<string>();
	for (const state of dataset.allStates()) {
		allStates.set(state.id, state);
	}
	return {
		id: dataset.id,
		taxons: Array.from(dataset.taxonsHierarchy.allItems).map(taxon => encodeTaxon(taxon, dataset, picIds)),
		characters: Array.from(characters).map(character => encodeCharacter(dataset, character, picIds)),
		states: Array.from(map(allStates.values(), s => encodeState(s, picIds))),
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

function decodeCharacter(presetStates: Record<CharacterPreset, State[]>, character: EncodedCharacter, states: IMap<State>): Character {
	const item = decodeHierarchicalItem(character);
	const charStates: State[] = [];
	for (const stateId of character.states) {
		const state = states.get(stateId);
		if (typeof state !== "undefined") {
			charStates.push(state);
		}
	}
	return createCharacter({
		...item,
		presetStates,
		states: character.preset || charStates,
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
	const characters = new Hierarchy<Character>("c", new makeMap());
	const dictionaryEntries = new makeMap();
	const ds = new Dataset(
		dataset?.id ?? "0",
		taxons,
		characters,
		statesByTaxons,
		dictionaryEntries,
		books,
		dataset?.extraFields ?? [],
		states,
	);
	for (const state of dataset?.states ?? []) {
		states.set(state.id, decodeState(state));
	}
	for (const character of (dataset?.characters ?? dataset?.descriptors ?? [])) {
		const decodedCharacter = decodeCharacter(ds.presetStates, character, states);
		characters.add(decodedCharacter);
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
