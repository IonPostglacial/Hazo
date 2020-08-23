import type { sdd_State, sdd_MediaObject } from "../libs/SDD";

interface SddStateData {
    state: sdd_State;
    mediaObjects: sdd_MediaObject[];
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