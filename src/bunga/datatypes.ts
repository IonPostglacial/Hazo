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
    children: Record<string, T>;
    childrenOrder: string[];
}

export interface Character extends HierarchicalItem<Character> {
	states: State[];
	inapplicableStates: State[];
}

export interface Description {
    descriptor: Character;
    states: State[];
}

export interface Taxon extends HierarchicalItem<Taxon> {
	descriptions: Description[];
    bookInfoByIds:Record<string, BookInfo>;
}

export interface Dataset {
	id: string;
	taxons: Record<string, Taxon>;
	descriptors: Record<string, Character>;
	books: Book[];
	extraFields: Field[];
	dictionaryEntries: Record<string, any>;
}