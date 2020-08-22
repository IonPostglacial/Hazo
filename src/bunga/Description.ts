import { Character } from "./Character";
import { State } from "./State";

export interface Description {
    descriptor: Character;
    states: State[];
}