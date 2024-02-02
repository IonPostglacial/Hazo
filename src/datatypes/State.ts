import { HierarchicalItemInit } from "./HierarchicalItem";
import { State } from "./types";

type StateInit = Omit<HierarchicalItemInit, "type"|"children"> & { color?: string };

export function createState(init: StateInit): State {
    return {
        id: init.id ?? "", 
        path: init.path,
        type: "state", 
        name: { S: init.name.S, V: init.name.V ?? "", CN: init.name.CN ?? "", EN: init.name.EN ?? "", FR: init.name.FR ?? "" },
        detail: init.detail ?? "",
        pictures: init.pictures ?? [],
        color: init.color,
    };
}

export function setState(states: State[], state: State, selected: boolean) {
    if (selected) {
        states.push(state);
    } else {
        const i = states.findIndex(s => s.id === state.id);
        if (i >= 0) {
            states.splice(i, 1);
        }
    }
}