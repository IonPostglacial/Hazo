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
	description?: string;
	color?: string;
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