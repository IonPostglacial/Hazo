import { isTopLevel, createHierarchicalItem, picturesFromPhotos, Book, BookInfo, Character, Dataset, Field, Hierarchy, Picture, State, Taxon, IHierarchicalItem, iterHierarchy, forEachHierarchy } from "@/datatypes";
import { createCharacter, CharacterPreset } from "@/datatypes";
import { standardBooks } from "@/datatypes/stdcontent";
import { createTaxon } from "@/datatypes/Taxon";
import { map } from "@/tools/iter";
import clone from "@/tools/clone";
import { fixParentIds } from "@/tools/fixes";

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
}

type EncodedCharacter = Omit<ReturnType<typeof encodeCharacter>, "photos"> & { photos: string[]|Picture[] };
type EncodedHierarchicalItem = Omit<ReturnType<typeof encodeHierarchicalItem>, "photos"> & { photos: string[]|Picture[] };
type EncodedDescription = { descriptorId: string, statesIds: string[] };

interface AlreadyEncodedDataset extends Omit<EncodedDataset, "characters"> {
	descriptors?: EncodedCharacter[]; // Legacy name of characters
	characters?:  EncodedCharacter[];
}

function deduplicatePicsIds(pictures: Iterable<Picture>, picIds: Set<string>): Picture[] {
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

function encodeHierarchicalItem(item: Hierarchy<any>, picIds: Set<string>) {
	const children = new Set<string>();

	for (const child of item.children) {
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

function encodeTaxon(taxon: Taxon, picIds: Set<string>, allStates: CharactersStateMap) {
	const descriptions: EncodedDescription[] = [];
	const statesByChar: Map<string, string[]> = new Map();
	for (const state of taxon.states) {
		const ch = allStates.get(state.id)?.character;
		if (!ch) { continue; }
		let states = statesByChar.get(ch.id);
		if (typeof states === "undefined") {
			states = [];
			statesByChar.set(ch.id, states);
		}
		states.push(state.id);
	}
	for (const [descriptorId, statesIds] of statesByChar.entries()) {
		descriptions.push({ descriptorId, statesIds });
	}
	return {
		...encodeHierarchicalItem(taxon, picIds),
		bookInfoByIds: taxon.bookInfoByIds,
		specimenLocations: taxon.specimenLocations,
		descriptions,
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
		preset: character.characterType === "discrete" ? character.preset : undefined,
		inherentStateId: character.characterType === "discrete" ? character.inherentState?.id : '',
		inapplicableStatesIds: character.inapplicableStates.filter(s => typeof s !== "undefined").map(s => s.id),
		requiredStatesIds: character.requiredStates.filter(s => typeof s !== "undefined").map(s => s.id),
		...encodeHierarchicalItem(character, picIds),
	};
}

function decodeState(encoded: EncodedState): State {
	return {
		id: encoded.id,
		type: "state",
		name: {
			S: encoded.name,
			CN: encoded.nameCN,
			EN: encoded.nameEN,	
		},
		pictures: picturesFromPhotos(encoded.photos),
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

type CharactersStateMap = Map<string, { state: State, character: Character }>;

export function encodeDataset(dataset: Dataset): EncodedDataset {
	const allStates: CharactersStateMap = new Map();
	const picIds = new Set<string>();
	const characters: ReturnType<typeof encodeCharacter>[] = [];
	forEachHierarchy(dataset.charactersHierarchy, character => {
		if (character.id !== "c0") {
			characters.push(encodeCharacter(dataset, character, picIds));
		}
		if (character.characterType === "discrete") {
			for (const state of character.states) {
				allStates.set(state.id, { state, character });
			}
		}
	});
	fixParentIds(dataset.taxonsHierarchy);
	fixParentIds(dataset.charactersHierarchy);
	return {
		id: dataset.id,
		taxons: Array.from(iterHierarchy(dataset.taxonsHierarchy)).filter(t => t.id !== "t0").map(taxon => encodeTaxon(taxon, picIds, allStates)),
		characters,
		states: Array.from(map(allStates.values(), s => encodeState(s.state, picIds))),
		books: dataset.books,
		extraFields: dataset.extraFields,
	};
}

function decodeHierarchicalItem(item: EncodedHierarchicalItem): IHierarchicalItem {
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

function decodeCharacter(presetStates: Record<CharacterPreset, State[]>, character: EncodedCharacter, states: Map<string, State>): Character {
	const item = decodeHierarchicalItem(character);
	const charStates = new Map<string, State>();
	for (const stateId of character.states) {
		const state = states.get(stateId);
		if (typeof state !== "undefined") {
			charStates.set(state.id, state);
		}
	}
	return createCharacter({
		...item,
		presetStates,
		states: character.preset || Array.from(charStates.values()),
		inherentState: typeof character.inherentStateId === "undefined" ? undefined : states.get(character.inherentStateId),
		inapplicableStates: character.inapplicableStatesIds?.map(id => states.get(id)!) ?? [],
		requiredStates: character.requiredStatesIds?.map(id => states.get(id)!) ?? [],
	});
}

export function decodeDataset(dataset: AlreadyEncodedDataset|undefined): Dataset {
	const states = new Map<string, State>();
	const books = standardBooks.slice();
	const ds = new Dataset(
		dataset?.id ?? "0",
		createTaxon({ id: "t0", name: { S: "<TOP>" } }),
		createCharacter({ id: "c0", name: { S: "<TOP>" } }),
		books,
		dataset?.extraFields ?? [],
		states,
	);

	for (const state of dataset?.states ?? []) {
		states.set(state.id, decodeState(state));
	}
	for (const character of (dataset?.characters ?? dataset?.descriptors ?? [])) {
		const decodedCharacter = decodeCharacter(ds.presetStates, character, states);
		ds.addCharacter(decodedCharacter);
	}
	for (const taxon of dataset?.taxons ?? []) {
		ds.addTaxon(decodeTaxon(taxon, books));
		taxon.descriptions.forEach(d => {
			for (const stateId of d.statesIds) {
				const t = ds.taxon(taxon.id);
				const state = states.get(stateId);
				if (typeof t !== "undefined" && typeof state !== "undefined") {
					ds.setTaxonState(t.id, state);
				}
			}
		});
	}
	return ds;
}
