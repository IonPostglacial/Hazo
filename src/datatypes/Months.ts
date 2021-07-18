import { State } from "./types";

const Months = {
    NAMES: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEV"],
    JAN: 1,
    FEB: 2,
    MAR: 4,
    APR: 8,
    MAY: 16,
    JUN: 32,
    JUL: 64,
    AUG: 128,
    SEP: 256,
    OCT: 512,
    NOV: 1024,
    DEC: 2048,
    floweringStates: [
        { id: "s_month_jan", name: { S: "JAN" }, pictures: [], },
        { id: "s_month_feb", name: { S: "FEB" }, pictures: [], },
        { id: "s_month_mar", name: { S: "MAR" }, pictures: [], },
        { id: "s_month_apr", name: { S: "APR" }, pictures: [], },
        { id: "s_month_may", name: { S: "MAY" }, pictures: [], },
        { id: "s_month_jun", name: { S: "JUN" }, pictures: [], },
        { id: "s_month_jul", name: { S: "JUL" }, pictures: [], },
        { id: "s_month_aug", name: { S: "AUG" }, pictures: [], },
        { id: "s_month_sep", name: { S: "SEP" }, pictures: [], },
        { id: "s_month_oct", name: { S: "OCT" }, pictures: [], },
        { id: "s_month_nov", name: { S: "NOV" }, pictures: [], },
        { id: "s_month_dec", name: { S: "DEC" }, pictures: [], },
    ],
    fromStates(currentItems: State[]): number {
        let flowering = 0;
        for (const item of currentItems) {
            const monthIndex = Months.floweringStates.findIndex(s => s.id === item.id);
            flowering |= (1 << monthIndex);
        }
        return flowering;
    },
    name(month: number): string {
        const monthIndex = Math.log2(month);
        if (monthIndex < 12) {
            return this.NAMES[monthIndex];
        } else {
            return "???";
        }
    },
    has(bitset: number, month: number): boolean {
        return (bitset & month) !== 0;
    },
    with(bitset: number, month: number): number {
        return bitset | month;
    },
    without(bitset: number, month: number): number {
        return bitset & ~month;
    },
};

export default Months;