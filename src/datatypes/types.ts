export interface Book {
    id: string;
    label: string;
}

export interface Button {
    id: string;
    for: string;
    label: string;
}

export interface Picture {
	id: string;
	url: string;
	label: string;
	content?: string|Blob|undefined;
}

export interface BookInfo {
    fasc: string;
    page: number|undefined;
    detail: string;
}

export interface Field {
    std: boolean;
    id: string;
    label: string;
    icon: string;
}

export interface MultilangText {
	S: string;
	V?: string;
	CN?: string;
	EN?: string;
	FR?: string;
}

export interface State {
	id: string;
	name: MultilangText;
	pictures: Picture[];
	description?: string;
	color?: string;
}

export type ItemType = "taxon" | "character" | "state";

export interface Taxon {
	pictures: Picture[];
	states: State[];
	author: string;
	vernacularName2: string;
	name2: string;
	meaning: string;
	herbariumPicture: string;
	website: string;
	noHerbier: number|undefined;
	fasc: number|undefined;
	page: number|undefined;
	detail : string;
	bookInfoByIds?: Record<string, BookInfo>
	specimenLocations?: { lat: number, lng: number }[];
	extra: Record<string, any>;
}

export type CharacterPreset = "flowering" | "family";

export interface Character {
	pictures: Picture[];
	detail : string;
	states: State[];
	inherentState?: State;
	inapplicableStates: State[];
	requiredStates: State[];
	preset: CharacterPreset|undefined;
}

export type Hierarchy = {
	id: string;
	type: ItemType;
	name: MultilangText;
	hidden: boolean;
	children: Hierarchy[];
};

export type SelectableHierarchy = Hierarchy & {
	selected?: boolean,
	children: SelectableHierarchy[]
};

export type HierarchyInit = Partial<Hierarchy> & { type: ItemType, name: MultilangText };

export interface Description {
    character: { id: string, name: MultilangText };
    states: State[];
}

export interface DictionaryEntry {
	id: string,
	nameCN: string;
	nameEN: string;
	nameFR: string;
	defCN: string;
	defEN: string;
	defFR: string;
	url: string;
}

export interface IMap<T> {
    get(key: string): T|undefined;
    has(key: string): boolean;
    set(key: string, value: T): void;
    delete(key: string): void;
    size: number;
    [Symbol.iterator](): Iterator<[string, T]>;
    keys(): Iterable<string>;
    values(): Iterable<T>;
    clear(): void;
    entries(): Iterable<[string, T]>;
}