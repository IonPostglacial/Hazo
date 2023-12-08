import { HierarchicalItemInit } from "./HierarchicalItem";
import { State } from "./types";

type StateInit = Omit<HierarchicalItemInit, "type"|"children">;

export function createState(init: StateInit): State {
    return {
        id: init.id ?? "", 
        type: "state", 
        name: { S: init.name.S, V: init.name.V ?? "", CN: init.name.CN ?? "", EN: init.name.EN ?? "", FR: init.name.FR ?? "" },
        pictures: init.pictures ?? [], 
    };
}