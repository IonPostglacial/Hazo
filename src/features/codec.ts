import { isTopLevel, createHierarchicalItem, picturesFromPhotos, Book, BookInfo, Character, Dataset, Field, Hierarchy, Picture, State, Taxon, AnyHierarchicalItem, iterHierarchy, forEachHierarchy, createState, characterStates } from "@/datatypes";
import { taxonFromId, addTaxon, addCharacter, setTaxonState, createDataset, pathToItem, getParentId } from "@/datatypes/Dataset";
import { createCharacter } from "@/datatypes";
import { standardBooks } from "@/datatypes/stdcontent";
import { createTaxon } from "@/datatypes/Taxon";
import { map } from "@/tools/iter";
import clone from "@/tools/clone";
import { fixParentIds, fixStatePath } from "@/tools/fixes";
import makeid from "@/tools/makeid";

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

function encodeHierarchicalItem(item: Hierarchy<AnyHierarchicalItem>, picIds: Set<string>) {
	const children = new Set<string>();

	for (const child of item.children) {
		children.add(child.id);
	}
	return {
		id: item.id,
		type: item.type,
		parentId: getParentId(item),
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

function encodeCharacter(character: Character, picIds: Set<string>) {
	return {
		states: Array.from(characterStates(character)).filter(s => typeof s !== "undefined").map(s => s.id),
		preset: character.characterType === "discrete" ? character.preset : undefined,
		color: character.color,
		inherentStateId: character.characterType === "discrete" ? character.inherentState?.id : '',
		inapplicableStatesIds: character.inapplicableStates.filter(s => typeof s !== "undefined").map(s => s.id),
		requiredStatesIds: character.requiredStates.filter(s => typeof s !== "undefined").map(s => s.id),
		...encodeHierarchicalItem(character, picIds),
	};
}

function decodeState(encoded: EncodedState): State {
	const state = createState({
		id: encoded.id,
		path: [],
		name: {
			S: encoded.name,
			CN: encoded.nameCN,
			EN: encoded.nameEN,
		},
		pictures: [],
		detail: encoded.description ?? "",
		color: encoded.color,		
	});
	state.pictures = picturesFromPhotos(state, encoded.photos);
	return state;
}

function encodeState(state: State, picIds: Set<string>): EncodedState {
	return {
		id: state.id,
		name: state.name.S,
		nameEN: state.name.EN ?? "",
		nameCN: state.name.CN ?? "",
		photos: deduplicatePicsIds(state.pictures, picIds),
		description: state.detail,
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
			characters.push(encodeCharacter(character, picIds));
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

function decodeHierarchicalItem(item: EncodedHierarchicalItem): AnyHierarchicalItem {
	const h = createHierarchicalItem({
		...item,
		path: [],
		name: {
			S: item.name,
			V: item.vernacularName,
			CN: item.nameCN,
			EN: item.nameEN,
			FR: item.name,
		},
		pictures: [],
	});
	h.pictures = picturesFromPhotos(h, item.photos);
	return h;
}

function decodeTaxon(ds: Dataset, encodedTaxon: ReturnType<typeof encodeTaxon>, books: Book[]): Taxon {
	const bookInfoByIds = (typeof encodedTaxon.bookInfoByIds !== "undefined") ? encodedTaxon.bookInfoByIds : {};
	const item = decodeHierarchicalItem(encodedTaxon);
	if (Object.keys(bookInfoByIds).length === 0) {
		for (const book of books) {
			const info: BookInfo = {
				type: "bookinfo",
				id: "bi" + makeid(8),
				path: pathToItem(item),
				fasc: (book.id === "fmc") ? "" + encodedTaxon.fasc : "",
				page: (book.id === "fmc") ? encodedTaxon.page : "",
				detail: ""
			};
			bookInfoByIds[book.id] = info;
		}
	}
	const parent = ds.taxonsByIds.get(encodedTaxon.parentId ?? "t0");
	let path: string[] = [];
	if (parent) {
		path = pathToItem(parent);
	}
	return createTaxon({
		...item,
		path,
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

function decodeCharacter(ds: Dataset, character: EncodedCharacter, states: Map<string, State>): Character {
	const item = decodeHierarchicalItem(character);
	const charStates = new Map<string, State>();
	for (const stateId of character.states) {
		const state = states.get(stateId);
		if (typeof state !== "undefined") {
			charStates.set(state.id, state);
		}
	}
	const parent = ds.charactersByIds.get(character.parentId ?? "c0");
	let path: string[] = [];
	if (parent) {
		path = pathToItem(parent);
	}
	return createCharacter({
		statesById: new Map(ds.statesById),
		...item,
		path,
		preset: character.preset,
		states: Array.from(charStates.values()),
		color: character.color,
		inherentState: typeof character.inherentStateId === "undefined" ? undefined : states.get(character.inherentStateId),
		inapplicableStates: character.inapplicableStatesIds?.map(id => states.get(id)!) ?? [],
		requiredStates: character.requiredStatesIds?.map(id => states.get(id)!) ?? [],
	});
}

export function decodeDataset(dataset: AlreadyEncodedDataset|undefined): Dataset {
	const statesById = new Map<string, State>();
	const books = standardBooks.slice();
	const ds = createDataset({
		id: dataset?.id ?? "0",
		taxonsHierarchy: createTaxon({ id: "t0", path: [], name: { S: "<TOP>" } }),
		charactersHierarchy: createCharacter({ id: "c0", path: [], name: { S: "<TOP>" } }),
		books,
		extraFields: dataset?.extraFields ?? [],
		statesById,
	});

	for (const state of dataset?.states ?? []) {
		statesById.set(state.id, decodeState(state));
	}
	const unusedStates = new Set(statesById.keys());
	for (const character of (dataset?.characters ?? dataset?.descriptors ?? [])) {
		const oldStates = character.states;
		const uniqueStates = oldStates.filter(s => unusedStates.has(s));
		if (uniqueStates.length < oldStates.length) {
			console.warn("duplicate states", character);
			const duplicateStates = oldStates.filter(s => !unusedStates.has(s));
			const newStates = duplicateStates.flatMap(id => {
				const state = statesById.get(id);
				if (typeof state === "undefined") {
					return [];
				}
				return createState({ ...state, id: "" }); 
			});
			newStates.forEach(s => statesById.set(s.id, s));
			character.states = [...uniqueStates, ...newStates.map(s => s.id)];
		}
		oldStates.forEach(s => unusedStates.delete(s));
		const decodedCharacter = decodeCharacter(ds, character, statesById);
		addCharacter(ds, decodedCharacter);
	}
	for (const taxon of dataset?.taxons ?? []) {
		addTaxon(ds, decodeTaxon(ds, taxon, books));
		taxon.descriptions.forEach(d => {
			for (const stateId of d.statesIds) {
				const t = taxonFromId(ds, taxon.id);
				const state = statesById.get(stateId);
				if (typeof t !== "undefined" && typeof state !== "undefined") {
					setTaxonState(ds, t.id, state);
				}
			}
		});
	}
	fixStatePath(ds);
	return ds;
}
