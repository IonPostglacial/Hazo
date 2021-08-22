import { createHierarchy, picturesFromPhotos, Book, BookInfo, Character, Dataset, DictionaryEntry, Field, Hierarchy, IMap, Picture, State, Taxon } from "@/datatypes";
import { createCharacter, CharacterPreset } from "@/datatypes";
import { standardBooks } from "@/datatypes/stdcontent";
import { createTaxon } from "@/datatypes/Taxon";
import { map } from "@/tools/iter";
import clone from "@/tools/clone";
import { allItems, forEachItem } from "@/datatypes/hierarchy";
import { SetLike } from "@/tools/generateid";
import { ItemType } from "@/datatypes/types";

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
type EncodedHierarchicalItem = Omit<ReturnType<typeof encodeHierarchy>, "photos"> & { photos: string[]|Picture[] };
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

function encodeHierarchy(hierarchy: Hierarchy, picIds: Set<string>) {
	const children = new Set<string>();

	forEachItem(hierarchy, child => {
		children.add(child.id);
	});
	return {
		id: hierarchy.id,
		type: hierarchy.type,
		children: [...children],
		name: hierarchy.name.S,
		nameEN: hierarchy.name.EN,
		nameCN: hierarchy.name.CN,
		vernacularName: hierarchy.name.V,
	};
}

function encodeDescription(characterId: string, states: State[]): EncodedDescription {
	return { descriptorId: characterId, statesIds: states.map(s => s.id) };
}

function encodeTaxon(dataset: Dataset, h: Hierarchy, picIds: Set<string>) {
	const taxon = dataset.taxonsProps.get(h.id);
	return {
		...encodeHierarchy(dataset.taxonsHierarchy, picIds),
		photos: deduplicatePicsIds(taxon?.pictures ?? [], picIds),
		bookInfoByIds: taxon?.bookInfoByIds,
		specimenLocations: taxon?.specimenLocations,
		descriptions: taxon ? [...dataset.taxonDescriptions(taxon)].map(d => encodeDescription(d.character.id, d.states)) : [],
		author: taxon?.author,
		vernacularName2: taxon?.vernacularName2,
		name2: taxon?.name2,
		meaning: taxon?.meaning,
		herbariumPicture: taxon?.herbariumPicture,
		website: taxon?.website,
		noHerbier: taxon?.noHerbier,
		fasc: taxon?.fasc,
		page: taxon?.page,
		detail: taxon?.detail,
		extra: taxon?.extra,
	};
}

function encodeCharacter(dataset: Dataset, h: Hierarchy, picIds: Set<string>) {
	const character = dataset.charProps.get(h.id);
	return {
		...encodeHierarchy(h, picIds),
		states: Array.from(dataset.characterStates(h.id)).filter(s => typeof s !== "undefined").map(s => s.id),
		photos: deduplicatePicsIds(character?.pictures ?? [], picIds),
		preset: character?.preset,
		inherentStateId: character?.inherentState?.id,
		inapplicableStatesIds: character?.inapplicableStates.filter(s => typeof s !== "undefined").map(s => s.id),
		requiredStatesIds: character?.requiredStates.filter(s => typeof s !== "undefined").map(s => s.id),
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
	const allStates = new Map<string, State>();
	const picIds = new Set<string>();
	for (const state of dataset.allStates()) {
		allStates.set(state.id, state);
	}
	return {
		id: dataset.id,
		taxons: allItems(dataset.taxonsHierarchy).map(taxon => encodeTaxon(dataset, taxon, picIds)),
		characters: allItems(dataset.charactersHierarchy).map(character => encodeCharacter(dataset, character, picIds)),
		states: Array.from(map(allStates.values(), s => encodeState(s, picIds))),
		books: dataset.books,
		extraFields: dataset.extraFields,
		dictionaryEntries: Object.fromEntries(dataset.dictionaryEntries.entries()),
	};
}

function decodeHierarchicalItem(type: ItemType, items: SetLike, item: EncodedHierarchicalItem): Hierarchy {
	const prefix = type === "character" ? "c" : type === "state" ? "s" : type === "taxon" ? "t" : "";
	return createHierarchy(prefix, items, {
		id: item.id,
		type: type,
		name: {
			S: item.name,
			V: item.vernacularName,
			CN: item.nameCN,
			EN: item.nameEN,
			FR: item.name,
		},
		children: [],
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
	return createTaxon({
		pictures: picturesFromPhotos(encodedTaxon.photos),
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
	const charStates: State[] = [];
	for (const stateId of character.states) {
		const state = states.get(stateId);
		if (typeof state !== "undefined") {
			charStates.push(state);
		}
	}
	return createCharacter({
		pictures: picturesFromPhotos(character.photos),
		presetStates,
		states: character.preset || charStates,
		inherentState: typeof character.inherentStateId === "undefined" ? undefined : states.get(character.inherentStateId),
		inapplicableStates: character.inapplicableStatesIds?.map(id => states.get(id)!) ?? [],
		requiredStates: character.requiredStatesIds?.map(id => states.get(id)!) ?? [],
	});
}

export function decodeDataset(makeMap: { new(): IMap<any> }, dataset: AlreadyEncodedDataset|undefined): Dataset {
	const states: IMap<State> = new makeMap();
	const taxons = createHierarchy("t", new makeMap(), { id: "", type: "taxon", name: { S: "TOP" }, children: [] });
	const books = standardBooks.slice();
	const characters = createHierarchy("c", new makeMap(), { id: "", type: "character", name: { S: "TOP" }, children: [] });
	const dictionaryEntries = new makeMap();
	const ds = new Dataset(dataset?.id ?? "0", makeMap);
	for (const state of dataset?.states ?? []) {
		states.set(state.id, decodeState(state));
	}
	for (const character of (dataset?.characters ?? dataset?.descriptors ?? [])) {
		ds.addCharacter({
			h: decodeHierarchicalItem("character", new Set(), character),
			props: decodeCharacter(ds.presetStates, character, states),
			at: [],
		});
	}
	for (const taxon of dataset?.taxons ?? []) {
		ds.addTaxon({
			h: decodeHierarchicalItem("taxon", new Set(), taxon),
			props: decodeTaxon(taxon, books),
			at: [],
		});
		taxon.descriptions.forEach(d => {
			for (const stateId of d.statesIds) {
				const state = states.get(stateId);
				if (typeof state !== "undefined") {
					ds.setTaxonState(taxon.id, state);
				}
			}
		});
	}
	for (const entry of Object.values(dataset?.dictionaryEntries ?? {})) {
		if (typeof entry !== "undefined") {
			dictionaryEntries.set(entry.id, entry);
		}
	}
	return ds;
}
