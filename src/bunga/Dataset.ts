import type { bunga_Taxon, bunga_Character, bunga_Field, bunga_State, sdd_Taxon, sdd_State, sdd_Character, sdd_Dataset, sdd_MediaObject } from "../libs/SDD";
import { Book } from "./Book";
const Character = window.bunga.Character, State = window.bunga.State, Taxon = window.bunga.Taxon;

function extractStatesById(sddContent:sdd_Dataset, photosByRef: Record<string, string>) {
	const statesById: Record<string, bunga_State> = {};

	for (const state of sddContent.states) {
		statesById[state.id] = State.fromSdd(state, photosByRef);
	}
	return statesById;
}

function extractItemsById(sddContent:sdd_Dataset, descriptors: Record<string, bunga_Character>, extraFields: bunga_Field[], statesById: Record<string, bunga_State>, photosByRef: Record<string, string>) {
	const itemsById: Record<string, bunga_Taxon> = {};

	for (const taxon of sddContent.taxons) {
		itemsById[taxon.id] = Taxon.fromSdd(taxon, extraFields, photosByRef, descriptors, statesById);
	}
	return itemsById;
}

function extractDescriptorsById(sddContent:sdd_Dataset, statesById: Record<string, bunga_State>, photosByRef: Record<string, string>) {
	const descriptorsById: Record<string, bunga_Character> = {};

	for (const character of sddContent.characters) {
		descriptorsById[character.id] = Character.fromSdd(character, photosByRef, statesById);
	}
	return descriptorsById;
}

function extractPhotosByRef(sddContent:sdd_Dataset) {
	const photosByRef: Record<string, string> = {};

	for (const mediaObject of sddContent.mediaObjects) {
		photosByRef[mediaObject.id] = mediaObject.source;
	}
	return photosByRef;
}

export class Dataset {
	id = "0";
	taxons: Record<string, bunga_Taxon>;
	descriptors: Record<string, bunga_Character>;
	books: Book[];
	extraFields: bunga_Field[];
	dictionaryEntries: Record<string, any>;

	constructor(id: string, taxons: Record<string, bunga_Taxon>, descriptors: Record<string, bunga_Character>, books: Book[] = Book.standard.slice(), extraFields: bunga_Field[] = [], dictionaryEntries: Record<string, any> = {}) {
		this.id = id;
		this.taxons = taxons;
		this.descriptors = descriptors;
		this.books = books;
		this.extraFields = extraFields;
		this.dictionaryEntries = dictionaryEntries;
	}

	static fromSdd(dataset: sdd_Dataset, extraFields: bunga_Field[]):Dataset {
		const photosByRef = extractPhotosByRef(dataset);
		const statesById = extractStatesById(dataset, photosByRef);

		const descriptors = extractDescriptorsById(dataset, statesById, photosByRef);

		for (const descriptor of Object.values(descriptors)) {
			descriptor.hydrateChildren(descriptors);
		}

		const taxons = extractItemsById(dataset, descriptors, extraFields, statesById, photosByRef);

		for (const item of Object.values(taxons)) {
			item.hydrateChildren(taxons);
		}

		return new Dataset("0", taxons, descriptors);
	}

	static toSdd(dataset:Dataset, extraFields:Array<bunga_Field>):sdd_Dataset {
		const taxons: sdd_Taxon[] = [],
			characters: sdd_Character[] = [];
		let states: sdd_State[] = [],
			mediaObjects: sdd_MediaObject[] = [];

		for (const taxon of Object.values(dataset.taxons)) {
			const sddData = Taxon.toSdd(taxon, extraFields, mediaObjects);
			taxons.push(sddData.taxon);
			mediaObjects = mediaObjects.concat(sddData.mediaObjects);
		}
		for (const character of Object.values(dataset.descriptors)) {
			const sddData = Character.toSdd(character, extraFields, mediaObjects);
			characters.push(sddData.character);
			states = states.concat(sddData.states);
			mediaObjects = mediaObjects.concat(sddData.mediaObjects);
		}
		return {
			taxons: taxons,
			characters: characters,
			states: states,
			mediaObjects: mediaObjects,
		};
	}
}