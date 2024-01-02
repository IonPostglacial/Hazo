import { Hierarchy } from "./hierarchy";

export type Field = {
    std: boolean;
    id: string;
    label: string;
    icon: string;
};

export type DocumentType = "book" | "bookinfo" | "character" | "picture" | "state" | "taxon";

export type AnyDocument = {
	type: DocumentType;
	id: string;
	path: string[];
};

export type Book = AnyDocument & {
	type: "book";
    label: string;
};

export type Picture = AnyDocument & {
	type: "picture";
	url: string;
	label: string;
	hubUrl: string|undefined;
};

export type BookInfo = AnyDocument & {
	type: "bookinfo";
    fasc: string;
    page: string;
    detail: string;
};

export type MultilangText = {
	S: string;
	V?: string;
	CN?: string;
	EN?: string;
	FR?: string;
} & Partial<Record<string, string>>;

export type AnyItem = AnyDocument & {
	name: MultilangText;
	detail : string;
	pictures: Picture[];
};

export type State = AnyItem & {
	type: "state";
	color?: string;
};

export type AnyHierarchicalItem = AnyItem & {
	type: "character" | "taxon",
};

export type Measurement = {
	value: number,
	character: RangeCharacter,
};

export type Taxon = AnyHierarchicalItem & {
	type: "taxon";
	states: State[];
	measurements: Partial<Record<string, Measurement>>;
	author: string;
	vernacularName2: string;
	name2: string;
	meaning: string;
	herbariumPicture: string;
	website: string;
	noHerbier: string|undefined;
	fasc: string;
	page: string;
	detail : string;
	bookInfoByIds?: Record<string, BookInfo>
	specimenLocations?: { lat: number, lng: number }[];
	extra: Record<string, any>;
	children: Taxon[];
};

export type CharacterPreset = "flowering" | "family" | "map";
export type CharacterType = "discrete" | "range";

export type AnyCharacter = AnyHierarchicalItem & {
	type: "character";
	detail: string;
	color?: string;
	inapplicableStates: State[];
	requiredStates: State[];
	children: Character[];
};

export type Unit = {
	name: MultilangText,
	base?: { unit: Unit, factor: number },
};

export type RangeCharacter = AnyCharacter & {
	characterType: "range",
	min?: number, max?: number,
	unit?: Unit,
};

export type DiscreteCharacter = AnyCharacter & {
	characterType: "discrete";
	states: State[];
	inherentState?: State;
	preset: CharacterPreset|undefined;
};

export type Character = DiscreteCharacter | RangeCharacter;

export type HierarchicalItem = Taxon | Character;
export type Item = Character | State | Taxon;

export type Description = {
    character: Character;
    states: State[];
};

export type DictionaryEntry = {
	id: string,
	name: { CN: string, EN: string, FR: string },
	defCN: string;
	defEN: string;
	defFR: string;
	url: string;
};

export type Dictionary = {
	entries: DictionaryEntry[],
};

export type GeoMap = { 
	name: string, 
	fileName: string, 
	center: [number, number], 
	scale: number, 
	property: string 
};

export type Dataset = {
    id: string,
    taxonsHierarchy: Hierarchy<Taxon>,
    charactersHierarchy: Hierarchy<Character>,
    books: Book[],
    extraFields: Field[],
    statesById: Map<string, State>,
    taxonsByIds: Map<string, Taxon>,
    charactersByIds: Map<string, Character>,
    presetStates: Record<"family", { id: string, familyId: string, name: MultilangText, detail: string, pictures: Picture[] }[]>,
};