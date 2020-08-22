import type { sdd_Representation } from "../libs/SDD";
import { Field } from "./Field";

function escapeRegex(string:String):String {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface DetailDataInit {
	id: string;
	name?: string;
	author?: string;
	nameCN?: string;
	name2?: string;
	vernacularName?: string;
	vernacularName2?: string;
	meaning?: string;
	herbariumPicture?: string;
	website?: string;
	noHerbier?: number;
	fasc?: number;
	page?: number;
	detail?: string;
	photos?: Array<string>;
	extra?: Record<string, any>;
}

export class DetailData {
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

	constructor(init: DetailDataInit) {
		this.id = init.id;
		this.name = init.name ?? "";
		this.author = init.author ?? "";
		this.nameCN = init.nameCN ?? "";
		this.name2 = init.name2 ?? "";
		this.vernacularName = init.vernacularName ?? "";
		this.vernacularName2 = init.vernacularName2 ?? "";
		this.meaning = init.meaning ?? "";
		this.herbariumPicture = init.herbariumPicture ?? "";
		this.website = init.website ?? "";
		this.noHerbier = init.noHerbier;
		this.fasc = init.fasc;
		this.page = init.page;
		this.detail = init.detail ?? "";
		this.photos = init.photos ?? [];
		this.extra = init.extra ?? {};
	}

	static findInDescription(description: string, section: string) {
		const re = new RegExp(`${escapeRegex(section)}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
		const match = description.match(re);
		if (match)
			return match[1].trim();
		else
			return "";
	}

	static removeFromDescription(description: string, sections:Array<String>) {
		let desc = description;

		for (const section of sections) {
			const re = new RegExp(`${escapeRegex(section)}\\s*:\\s*(.*?)(?=<br><br>)`, "i");
			desc = desc.replace(re, "");
		}
		return desc;
	}

	toRepresentation(extraFields: Field[]): sdd_Representation {
		const data: DetailData = this;
		return {
			mediaObjectsRefs: [],
			label: `${name} / ${this.author} / ${this.nameCN}`,
			detail: "" + extraFields.map(function(field) {
				const value = ((field.std) ? data : data.extra)[field.id];
				if (value == null || value == "") {
					return "";
				}
				return `${field.label}: ${value}<br><br>`;
			}).join("") + (this.fasc != null) ? 'Flore Madagascar et Comores<br>fasc ${fasc}<br>page ${page}<br><br>' : "" + this.detail,
		};
	}

	static fromRepresentation(id: string, representation: sdd_Representation, extraFields: Field[], photosByRef: Record<string, string>): DetailData {
		const names = representation.label.split("/");
		const name = names[0], author = names[1], nameCN = names[2];

		const fields = Field.standard.concat(extraFields);
		const floreRe = /Flore Madagascar et Comores\s*<br>\s*fasc\s+(\d*)\s*<br>\s*page\s+(null|\d*)/i;
		let fasc: number|undefined = undefined, page: number|undefined = undefined;
		const match = representation.detail.match(floreRe);

		if (match) {
			fasc = parseInt(match[1]);
			page = parseInt(match[2]);
		}
		let detail = DetailData.removeFromDescription(representation.detail, fields.map(field => field.label)).replace(floreRe, "");

		const emptyParagraphRe = /<p>(\n|\t|\s|<br>|&nbsp;)*<\/p>/gi;
		if (detail.match(emptyParagraphRe)) {
			detail = detail.replace(emptyParagraphRe, "");
		}
		const photos = representation.mediaObjectsRefs.map(m => photosByRef[m.ref]);
		const data = new DetailData({ id: id, name: name, author: author, nameCN: nameCN, fasc: fasc, page: page, detail: detail, photos: photos });

		for (const field of fields) {
			((field.std) ? data : data.extra)[field.id] = DetailData.findInDescription(representation.detail, field.label);
		}
		return data;
	}
}
