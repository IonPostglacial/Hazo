export interface Book {
    id: string;
    label: string;
}

export interface Picture {
	id: string;
	url: string;
	label: string;
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

export interface BasicInfo {
	id: string;
	name: string;
	nameEN: string;
	nameCN: string;
	photos: Picture[];
}

export interface State extends BasicInfo {
    descriptorId: string;
	description?: string;
	color?: string;
}

export interface DetailData extends BasicInfo {
	author: string;
	vernacularName: string;
	vernacularName2: string;
	name2: string;
	meaning: string;
	herbariumPicture: string;
	website: string;
	noHerbier: number|undefined;
	fasc: number|undefined;
	page: number|undefined;
	detail : string;
	extra: Record<string, any>;
}

export interface HierarchicalItem<T> extends DetailData {
    type: string;
	parentId: string|undefined;
	topLevel: boolean;
	hidden: boolean;
	childrenOrder: string[]|undefined;
}

export interface Character extends HierarchicalItem<Character> {
	inherentState?: State;
	inapplicableStates: State[];
	requiredStates: State[];
}

export interface Description {
    character: Character;
    states: State[];
}

export interface Taxon extends HierarchicalItem<Taxon> {
    bookInfoByIds:Record<string, BookInfo>;
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