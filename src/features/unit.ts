import { Unit } from "@/datatypes";

export function toNormalizedValue(value: number, unit: Unit|undefined): number {
    if (unit?.base) {
        return value / unit.base.factor;
    }
    return value;
}

export function fromNormalizedValue(value: number|undefined, unit: Unit|undefined): number|undefined {
    if (unit?.base && value) {
        return value * unit.base.factor;
    }
    return value;
}