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
	hubUrl: string|undefined;
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

export interface BasicInfo {
	id: string;
	name: MultilangText;
	pictures: Picture[];
}

export interface State extends BasicInfo {
	description?: string;
	color?: string;
}

export interface HierarchicalItem extends BasicInfo {
	parentId?: string;
	type: string;
	hidden: boolean;
}

export interface Taxon extends HierarchicalItem {
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
	children: Taxon[];
}

export type CharacterPreset = "flowering" | "family";

export interface Character extends HierarchicalItem {
	detail : string;
	states: State[];
	inherentState?: State;
	inapplicableStates: State[];
	requiredStates: State[];
	preset: CharacterPreset|undefined;
	children: Character[];
}

export interface Description {
    character: Character;
    states: State[];
}

export interface DictionaryEntry {
	id: string,
	name: { CN: string, EN: string, FR: string },
	defCN: string;
	defEN: string;
	defFR: string;
	url: string;
}

export interface Dictionary {
	entries: DictionaryEntry[],
}