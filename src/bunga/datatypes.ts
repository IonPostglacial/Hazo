export interface Book {
    id: string;
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

export interface State {
    id: string;
    descriptorId: string;
    name: string;
    photos: string[];
}

export interface DetailData {
    id: string;
	name: string;
	author: string;
	nameCN: string;
	name2: string;
	vernacularName: string;
	vernacularName2: string;
	meaning: string;
	herbariumPicture: string;
	website: string;
	noHerbier: number|undefined;
	fasc: number|undefined;
	page: number|undefined;
	detail : string;
	photos: string[];
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
	states: State[];
	inapplicableStates: State[];
	requiredStates: State[];
}

export interface Description {
    character: Character;
    states: State[];
}

export interface Taxon extends HierarchicalItem<Taxon> {
	statesSelection: Record<string, boolean|undefined>;
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

export interface Dataset {
	id: string;
	taxons: Record<string, Taxon>;
	characters: Record<string, Character>;
	books: Book[];
	extraFields: Field[];
	dictionaryEntries: Record<string, DictionaryEntry>;
}