export type Book = {
    id: string;
    label: string;
};

export type Picture= {
	id: string;
	url: string;
	label: string;
	hubUrl: string|undefined;
};

export type BookInfo = {
    fasc: string;
    page: number|undefined;
    detail: string;
};

export type Field = {
    std: boolean;
    id: string;
    label: string;
    icon: string;
};

export type MultilangText = {
	S: string;
	V?: string;
	CN?: string;
	EN?: string;
	FR?: string;
} & Partial<Record<string, string>>;

export type BasicInfo = {
	id: string;
	name: MultilangText;
	pictures: Picture[];
};

export type State = BasicInfo & {
	type: "state";
	description?: string;
	color?: string;
};

export type IHierarchicalItem = BasicInfo & {
	parentId?: string;
	hidden: boolean;
};

export type SelectableItem = IHierarchicalItem & {
	selected?: boolean
}

export type Taxon = IHierarchicalItem & {
	type: "taxon";
	states: State[];
	author: string;
	vernacularName2: string;
	name2: string;
	meaning: string;
	herbariumPicture: string;
	website: string;
	noHerbier: string|undefined;
	fasc: number|undefined;
	page: number|undefined;
	detail : string;
	bookInfoByIds?: Record<string, BookInfo>
	specimenLocations?: { lat: number, lng: number }[];
	extra: Record<string, any>;
	children: Taxon[];
};

export type CharacterPreset = "flowering" | "family" | "map";

export type CharacterType = "discrete" | "range";

export type AnyCharacter = IHierarchicalItem & {
	type: "character";
	detail: string;
	inapplicableStates: State[];
	requiredStates: State[];
	children: Character[];
};

export type HierarchicalItem = Taxon | DiscreteCharacter | RangeCharacter;

export type RangeCharacter = AnyCharacter & {
	characterType: "range",
	min: number, max: number,
};

export type DiscreteCharacter = AnyCharacter & {
	characterType: "discrete";
	states: State[];
	inherentState?: State;
	preset: CharacterPreset|undefined;
};

export type Character = DiscreteCharacter | RangeCharacter;

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