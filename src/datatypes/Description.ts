import { Character } from "./Character";
import { State } from "./types";

export interface Description {
    character: Character;
    states: State[];
}