import { Character } from "./Character";
import { State } from "./datatypes";

export interface Description {
    character: Character;
    states: State[];
}