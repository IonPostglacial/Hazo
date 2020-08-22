import { HierarchicalItem } from "./HierarchicalItem";
import { Taxon } from "./Taxon";
import { BookInfo } from "./BookInfo";
import { Character } from "./Character";
import { State } from "./State";
import { Field } from "./Field";
import { Book } from "./Book";
import { Dataset } from "./Dataset";
import { DetailData } from "./DetailData";

class CodedHierarchicalItem extends DetailData {
	type: string;
	parentId: string|undefined;
	topLevel: boolean;
	children: string[] = [];

	constructor(item: HierarchicalItem) {
		super(item);
		this.type = item.type;
		this.parentId = item.parentId;
		this.topLevel = item.topLevel;
		for (const child of Object.values(item.children)) {
			if (typeof child === "undefined" || child === null) {
				console.log(item.name + " has null child");
				console.log(item);
			} else {
				this.children.push(child.id);
			}
		}
	}
}

class CodedDescription {
	descriptorId: string;
	statesIds: string[];

	constructor(descriptorId: string, statesIds: string[]) {
		this.descriptorId = descriptorId;
		this.statesIds = statesIds;
	}
}

class CodedTaxon extends CodedHierarchicalItem {
	descriptions: CodedDescription[];
	bookInfoByIds: Record<string, BookInfo> = {};

	constructor(taxon: Taxon) {
		super(taxon);
		this.bookInfoByIds = taxon.bookInfoByIds;
		this.descriptions = taxon.descriptions.map(d => new CodedDescription(d.descriptor.id, d.states.map(s => s.id)));
	}
}

class CodedCharacter extends CodedHierarchicalItem {
	states: string[];
	inapplicableStatesIds: string[];
	inapplicableStates: State[]|null = null; // Only here to fix an oversight of the JS version

	constructor(character: Character) {
		super(character);
		this.states = character.states.map(s => s.id);
		this.inapplicableStatesIds = character.inapplicableStates.map(s => s.id);
	}
}

class CodedDataset {
	id: string;
	states: State[];
	taxons: CodedTaxon[];
	descriptors: CodedCharacter[];
	books: Book[];
	extraFields: Field[];
	dictionaryEntries: Record<string, any>;

	static getAllStates(dataset: Dataset): State[] {
		let states: State[] = [];
		for (const character of Object.values(dataset.descriptors)) {
			states = states.concat(character.states);
		}
		return states;
	}

	constructor(dataset: Dataset) {
		this.id = dataset.id;
		this.taxons = Object.values(dataset.taxons).map(taxon => new CodedTaxon(taxon));
		this.descriptors = Object.values(dataset.descriptors).map(character => new CodedCharacter(character));
		this.states = CodedDataset.getAllStates(dataset);
		this.books = dataset.books;
		this.extraFields = dataset.extraFields;
		this.dictionaryEntries = dataset.dictionaryEntries;
	}
}

function decodeHierarchicalItem(item: CodedHierarchicalItem): HierarchicalItem {
	return new HierarchicalItem({...item, childrenIds: item.children});
}

function decodeTaxon(taxon: CodedTaxon, descriptions: Record<string, Character>, states: Record<string, State>, books: Book[]): Taxon {
	const bookInfoByIds = (typeof taxon.bookInfoByIds !== "undefined") ? taxon.bookInfoByIds : {};

	if (Object.keys(bookInfoByIds).length === 0) {
		for (const book of Book.standard) {
			const info:BookInfo = {
				fasc: (book.id === "fmc") ? "" + taxon.fasc : "",
				page: (book.id === "fmc") ? taxon.page : undefined,
				detail: ""
			};
			bookInfoByIds[book.id] = info;
		}
	}
	const item = decodeHierarchicalItem(taxon);
	return new Taxon({
		...item,
		childrenIds: item.childrenIds,
		descriptions: taxon.descriptions.map(function(d) { return {
			descriptor: descriptions[d.descriptorId],
			states: d.statesIds.map(id => states[id]),
		}}),
		bookInfoByIds,
	});
}

function decodeCharacter(character:CodedCharacter, states: Record<string, State>): Character {
	const item = decodeHierarchicalItem(character);
	return new Character({
		...item,
		childrenIds: item.childrenIds,
		states: character.states.map(id => states[id]),
		inapplicableStates: (typeof character.inapplicableStates !== "undefined") ?
			(character.inapplicableStates?.map(s => states[s.id]) ?? []) :
			(character.inapplicableStatesIds?.map(id => states[id]) ?? [])
		
	});
}

export function encodeDataset(dataset: Dataset) {
	return new CodedDataset(dataset);
}

export function decodeDataset(dataset: CodedDataset): Dataset {
	const states: Record<string, State> = {};
	const descriptors: Record<string, Character> = {};
	const taxons: Record<string, Taxon> = {};
	const books = Book.standard.slice();

	for (const state of dataset.states) {
		states[state.id] = state;
	}
	for (const descriptor of dataset.descriptors) {
		descriptors[descriptor.id] = decodeCharacter(descriptor, states);
	}
	for (const taxon of dataset.taxons) {
		taxons[taxon.id] = decodeTaxon(taxon, descriptors, states, books);
	}
	for (const descriptor of Object.values(descriptors)) {
		descriptor.hydrateChildren(descriptors);
	}
	for (const taxon of Object.values(taxons)) {
		taxon.hydrateChildren(taxons);
	}
	return new Dataset(
		dataset.id,
		taxons,
		descriptors,
		books,
		dataset.extraFields,
		dataset.dictionaryEntries,
	);
}
