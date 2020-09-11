export interface MediaObject {
    id: string;
    source: string;
    label: string;
    detail: string;
}

export interface MediaObjectRef {
    ref: string;
}

export interface StateRef {
    ref: string;
}

export interface CategoricalRef {
	ref: string;
	stateRefs: StateRef[];
}

export interface Representation {
    label: string;
	detail: string;
	mediaObjectsRefs: MediaObjectRef[];
}

export interface State extends Representation {
    id: string;
	characterId: string;
}

export interface Character extends Representation {
    id: string;
	states: State[];
	inapplicableStatesRefs: StateRef[];
	parentId?: string;
	childrenIds: string[];
}

export interface Taxon extends Representation {
	id: string;
	hid: string;
	parentId?: string;
	categoricals: CategoricalRef[];
	childrenIds: string[];
}

export interface Dataset {
    taxons: Taxon[];
	characters: Character[];
	states: State[];
	mediaObjects: MediaObject[];
}