import type { State as sdd_State, MediaObject } from "../sdd/datatypes";

interface SddStateData {
    state: sdd_State;
    mediaObjects: MediaObject[];
}

export class State {
    constructor(
        public id: string,
        public descriptorId: string,
        public name: string,
        public photos: string[],
    ) {}

    static fromSdd(state:sdd_State, photosByRef: Record<string, string>): State {
        return {
            id: state.id,
            descriptorId: state.characterId,
            name: state.label,
            photos: state.mediaObjectsRefs?.map(m => photosByRef[m.ref]),
        };
    }

    static toSdd(state:State):SddStateData {
        return {
            state: {
                id: state.id,
                characterId: state.descriptorId,
                label: state.name,
                detail: "",
                mediaObjectsRefs: [],
            },
            mediaObjects: [],
        }
    }
}