import { Book, Character, Dataset, Field, Taxon } from "./datatypes";
import { standardBooks } from "./stdcontent";


export function createDataset(id: string, taxons: Record<string, Taxon>, characters: Record<string, Character>, books: Book[] = standardBooks.slice(), extraFields: Field[] = [], dictionaryEntries: Record<string, any> = {}): Dataset {
	return { id, taxons, characters, books, extraFields, dictionaryEntries };
}