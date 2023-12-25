import { MultilangText } from "@/datatypes";

export function multilangTextEquals(t1: MultilangText, t2: MultilangText): boolean {
    const keysT1 = Object.keys(t1);
    const keysT2 = Object.keys(t2);
    if (keysT1.length !== keysT2.length) {
        return false;
    }
    return keysT1.every(key => t1[key] === t2[key]);
}