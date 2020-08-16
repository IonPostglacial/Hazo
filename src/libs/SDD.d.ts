/* tslint:disable */// Generated by Haxe TypeScript Declaration Generator :)

export class bunga_Book {
	constructor(id: string, label: string);
	id: string;
	label: string;
	static readonly standard: bunga_Book[];
}

export class bunga_Field {
	constructor(std: boolean, id: string, label: string);
	std: boolean;
	id: string;
	label: string;
	static readonly standard: bunga_Field[];
}

export class sdd_MediaObjectRef {
	constructor(ref: string);
	ref: string;
}

export class sdd_Representation {
	constructor(label: string, detail: string, mediaObjectsRefs?: sdd_MediaObjectRef[]);
	_hx_constructor(label: string, detail: string, mediaObjectsRefs?: sdd_MediaObjectRef[]): void;
	label: string;
	detail: string;
	mediaObjectsRefs: sdd_MediaObjectRef[];
	static _hx_skip_constructor: boolean;
}

export class bunga_DetailData {
	protected constructor(name: string, author?: string, nameCN?: string, fasc?: number, page?: number, detail?: string, photos?: string[], fields?: bunga_Field[], name2?: string, vernacularName?: string, vernacularName2?: string, meaning?: string, noHerbier?: number, website?: string, herbariumPicture?: string, extra?: { [key: string]: any });
	name: string;
	author: string;
	nameCN: string;
	name2: string;
	vernacularName: string;
	vernacularName2: string;
	meaning: string;
	herbariumPicture: string;
	website: string;
	noHerbier: number;
	fasc: number;
	page: number;
	detail: string;
	photos: string[];
	extra: { [key: string]: any };
	toRepresentation(extraFields: bunga_Field[]): sdd_Representation;
	static fromRepresentation(representation: sdd_Representation, extraFields: bunga_Field[], photosByRef: { [key: string]: string }): bunga_DetailData;
}

export class bunga_Item extends bunga_DetailData {
	constructor(id: string, data: bunga_DetailData);
	id: string;
}

export class bunga_HierarchicalItem extends bunga_Item {
	constructor(type: string, id: string, hid: string, parentId: string, topLevel: boolean, childrenIds: string[], data: bunga_DetailData);
	type: string;
	hid: string;
	parentId: string;
	topLevel: boolean;
	children: { [key: string]: bunga_HierarchicalItem };
	setEmptyChildren(childrenIds: string[]): void;
	hydrateChildren(hierarchyById: { [key: string]: bunga_HierarchicalItem }): void;
}

export class sdd_State extends sdd_Representation {
	constructor(id: string, characterId: string, representation: sdd_Representation);
	id: string;
	characterId: string;
}

export class sdd_MediaObject {
	constructor(id: string, source: string, label: string, detail: string);
	id: string;
	source: string;
	label: string;
	detail: string;
}

export class bunga_SddStateData {
	constructor(state: sdd_State, mediaObjects: sdd_MediaObject[]);
	state: sdd_State;
	mediaObjects: sdd_MediaObject[];
}

export class bunga_State {
	constructor(id: string, descriptorId: string, name: string, photos: string[]);
	id: string;
	descriptorId: string;
	name: string;
	photos: string[];
	static fromSdd(state: sdd_State, photosByRef: { [key: string]: string }): bunga_State;
	static toSdd(state: bunga_State): bunga_SddStateData;
}

export class sdd_StateRef {
	constructor(ref: string);
	ref: string;
}

export class sdd_Character extends sdd_Representation {
	constructor(id: string, parentId: string, representation: sdd_Representation, states?: sdd_State[], inapplicableStatesRefs?: sdd_StateRef[], childrenIds?: string[]);
	id: string;
	states: sdd_State[];
	inapplicableStatesRefs: sdd_StateRef[];
	parentId: string;
	childrenIds: string[];
}

export class bunga_SddCharacterData {
	constructor(character: sdd_Character, states: sdd_State[], mediaObjects: sdd_MediaObject[]);
	character: sdd_Character;
	states: sdd_State[];
	mediaObjects: sdd_MediaObject[];
}

export interface bunga_CharacterCreationData {
	name: string;
	parentId: string;
	states: bunga_State[];
	inapplicableStates: bunga_State[];
}

export class bunga_Character extends bunga_HierarchicalItem {
	constructor(item: bunga_HierarchicalItem, states: bunga_State[], inapplicableStates: bunga_State[]);
	states: bunga_State[];
	inapplicableStates: bunga_State[];
	static fromSdd(character: sdd_Character, photosByRef: { [key: string]: string }, statesById: { [key: string]: bunga_State }): bunga_Character;
	static toSdd(character: bunga_Character, extraFields: bunga_Field[], mediaObjects: sdd_MediaObject[]): bunga_SddCharacterData;
	static create(characters: { [key: string]: bunga_Character }, data: bunga_CharacterCreationData): bunga_Character;
}

export class bunga_CodedHierarchicalItem extends bunga_Item {
	constructor(item: bunga_HierarchicalItem);
	_hx_constructor(item: bunga_HierarchicalItem): void;
	type: string;
	hid: string;
	parentId: string;
	topLevel: boolean;
	children: string[];
}

export class bunga_Description {
	constructor(descriptor: bunga_Character, states: bunga_State[]);
	descriptor: bunga_Character;
	states: bunga_State[];
}

export class bunga_BookInfo {
	constructor(fasc: string, page: number, detail: string);
	fasc: string;
	page: number;
	detail: string;
}

export class sdd_CategoricalRef {
	constructor(ref: string, stateRefs: sdd_StateRef[]);
	ref: string;
	stateRefs: sdd_StateRef[];
}

export class sdd_Taxon extends sdd_Representation {
	constructor(id: string, parentId: string, representation: sdd_Representation, childrenIds?: string[], categoricals?: sdd_CategoricalRef[]);
	id: string;
	hid: string;
	parentId: string;
	categoricals: sdd_CategoricalRef[];
	childrenIds: string[];
}

export class bunga_SddTaxonData {
	constructor(taxon: sdd_Taxon, mediaObjects: sdd_MediaObject[]);
	taxon: sdd_Taxon;
	mediaObjects: sdd_MediaObject[];
}

export class bunga_Taxon extends bunga_HierarchicalItem {
	constructor(item: bunga_HierarchicalItem, descriptions: bunga_Description[], bookInfoByIds?: { [key: string]: bunga_BookInfo });
	_hx_constructor(item: bunga_HierarchicalItem, descriptions: bunga_Description[], bookInfoByIds?: { [key: string]: bunga_BookInfo }): void;
	descriptions: bunga_Description[];
	bookInfoByIds: { [key: string]: bunga_BookInfo };
	static fromSdd(taxon: sdd_Taxon, extraFields: bunga_Field[], photosByRef: { [key: string]: string }, descriptors: { [key: string]: bunga_Character }, statesById: { [key: string]: bunga_State }): bunga_Taxon;
	static toSdd(taxon: bunga_Taxon, extraFields: bunga_Field[], mediaObjects: sdd_MediaObject[]): bunga_SddTaxonData;
}

export class bunga_CodedDescription {
	constructor(descriptorId: string, statesIds: string[]);
	descriptorId: string;
	statesIds: string[];
}

export class bunga_CodedTaxon extends bunga_CodedHierarchicalItem {
	constructor(taxon: bunga_Taxon);
	_hx_constructor(taxon: bunga_Taxon): void;
	descriptions: bunga_CodedDescription[];
	bookInfoByIds: { [key: string]: bunga_BookInfo };
}

export class bunga_CodedCharacter extends bunga_CodedHierarchicalItem {
	constructor(character: bunga_Character);
	states: string[];
	inapplicableStatesIds: string[];
	inapplicableStates: bunga_State[];
}

export class bunga_CodedDataset {
	constructor(dataset: bunga_Dataset);
	id: string;
	states: bunga_State[];
	taxons: bunga_CodedTaxon[];
	descriptors: bunga_CodedCharacter[];
	books: bunga_Book[];
	extraFields: bunga_Field[];
	dictionaryEntries: { [key: string]: any };
	static getAllStates(dataset: bunga_Dataset): bunga_State[];
}

export class bunga_Codec {
	protected constructor();
	static decodeHierarchicalItem<T>(item: bunga_CodedHierarchicalItem): bunga_HierarchicalItem;
	static decodeTaxon(taxon: bunga_CodedTaxon, descriptions: { [key: string]: bunga_Character }, states: { [key: string]: bunga_State }, books: bunga_Book[]): bunga_Taxon;
	static decodeCharacter(character: bunga_CodedCharacter, states: { [key: string]: bunga_State }): bunga_Character;
	static encodeDataset(dataset: bunga_Dataset): bunga_CodedDataset;
	static decodeDataset(dataset: bunga_CodedDataset): bunga_Dataset;
}

export class sdd_Dataset {
	constructor(taxons: sdd_Taxon[], characters: sdd_Character[], states: sdd_State[], mediaObjects: sdd_MediaObject[]);
	taxons: sdd_Taxon[];
	characters: sdd_Character[];
	states: sdd_State[];
	mediaObjects: sdd_MediaObject[];
}

export class bunga_Dataset {
	constructor(id: string, taxons: { [key: string]: bunga_Taxon }, descriptors: { [key: string]: bunga_Character }, books?: bunga_Book[], extraFields?: bunga_Field[], dictionaryEntries?: { [key: string]: any });
	id: string;
	taxons: { [key: string]: bunga_Taxon };
	descriptors: { [key: string]: bunga_Character };
	books: bunga_Book[];
	extraFields: bunga_Field[];
	dictionaryEntries: { [key: string]: any };
	static fromSdd(dataset: sdd_Dataset, extraFields: bunga_Field[]): bunga_Dataset;
	static toSdd(dataset: bunga_Dataset, extraFields: bunga_Field[]): sdd_Dataset;
}

export class bunga_DetailHighlighter {
	constructor();
	loadWordText(text: string): void;
	highlightTaxons(taxons: { [key: string]: bunga_Taxon }): void;
}

export type bunga_HierarchyEntry = {
	children: { [key: string]: bunga_HierarchyEntry };
	id: string;
	name: string;
	topLevel: boolean;
}

export class bunga_Hierarchy {
	protected constructor();
	static toZip(hierarchy: { [key: string]: bunga_HierarchyEntry }): ArrayBuffer;
}

export class bunga_ImageCache {
	constructor();
	initFromDatabase(): Promise<void>;
	addFromUrl(url: string): void;
	get(url: string): Blob;
}

export class bunga_TaxonToTex {
	constructor(taxons: bunga_Taxon[]);
	picture(resolve: (code: string) => any, urls: string[]): string;
	onProgress(listener: (progress: number, progressMax: number) => void): void;
	export(taxons: bunga_Taxon[]): Promise<ArrayBuffer>;
}

export class sdd_Loader {
	constructor(strictMode: boolean);
	readonly exceptionLog: string[];
	load(text: string): sdd_Dataset[];
}

export class sdd_Saver {
	constructor(datasets: sdd_Dataset[]);
	datasets: sdd_Dataset[];
	mediaObjectsCount: number;
	save(): string;
}