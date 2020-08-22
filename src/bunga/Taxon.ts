import { sdd_Taxon, sdd_MediaObject } from "../libs/SDD";
import { HierarchicalItem, HierarchicalItemInit } from "./HierarchicalItem";
import { Character } from "./Character";
import { Description } from "./Description";
import { DetailData } from "./DetailData";
import { BookInfo } from "./BookInfo";
import { State } from "./State";
import { Field } from "./Field";

interface SddTaxonData {
	taxon: sdd_Taxon;
	mediaObjects: sdd_MediaObject[];
}

interface TaxonInit extends HierarchicalItemInit { descriptions: Description[], bookInfoByIds?: Record<string, BookInfo> }

export class Taxon extends HierarchicalItem {
	descriptions: Description[];
	bookInfoByIds:Record<string, BookInfo>;

	constructor(init: TaxonInit) {
		super(init);
		this.descriptions = init.descriptions;
		this.bookInfoByIds = init.bookInfoByIds ?? {};
	}

	static fromSdd(taxon:sdd_Taxon, extraFields: Field[], photosByRef: Record<string, string>, descriptors: Record<string, Character>,
			statesById: Record<string, State>):Taxon {
		const descriptions = new Map<string, Description>();
		for (const categorical of taxon.categoricals) {
			const description:Description = {
				descriptor: descriptors[categorical.ref],
				states: categorical.stateRefs.map(s => statesById[s.ref])
			};
			descriptions.set(categorical.ref, description);
		}
		return new Taxon({
			type: "taxon",
			parentId: taxon.parentId,
			childrenIds: taxon.childrenIds,
			descriptions: [...descriptions.values()],
			...DetailData.fromRepresentation(taxon.id, taxon, extraFields, photosByRef)
		});
	}

	public static toSdd(taxon: Taxon, extraFields: Field[], mediaObjects: sdd_MediaObject[]):SddTaxonData {
		const sddTaxon: sdd_Taxon = {
			id: taxon.id,
			hid: taxon.id,
			parentId: taxon.parentId,
			...taxon.toRepresentation(extraFields),
			childrenIds: taxon.childrenIds.slice(),
			categoricals: taxon.descriptions.map(d => ({
				ref: d.descriptor.id,
				stateRefs: d.states.map(s => ({ ref: s.id }))
			})),
		};
		return {
			taxon: sddTaxon,
			mediaObjects: []
		};
	}
}
