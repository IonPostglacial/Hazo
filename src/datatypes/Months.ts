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
        { id: "s_month_jan", type: "state" as "state", name: { S: "JAN" }, pictures: [], },
        { id: "s_month_feb", type: "state" as "state", name: { S: "FEB" }, pictures: [], },
        { id: "s_month_mar", type: "state" as "state", name: { S: "MAR" }, pictures: [], },
        { id: "s_month_apr", type: "state" as "state", name: { S: "APR" }, pictures: [], },
        { id: "s_month_may", type: "state" as "state", name: { S: "MAY" }, pictures: [], },
        { id: "s_month_jun", type: "state" as "state", name: { S: "JUN" }, pictures: [], },
        { id: "s_month_jul", type: "state" as "state", name: { S: "JUL" }, pictures: [], },
        { id: "s_month_aug", type: "state" as "state", name: { S: "AUG" }, pictures: [], },
        { id: "s_month_sep", type: "state" as "state", name: { S: "SEP" }, pictures: [], },
        { id: "s_month_oct", type: "state" as "state", name: { S: "OCT" }, pictures: [], },
        { id: "s_month_nov", type: "state" as "state", name: { S: "NOV" }, pictures: [], },
        { id: "s_month_dec", type: "state" as "state", name: { S: "DEC" }, pictures: [], },
    ],
    fromStates(currentItems: {id: string}[]): number {
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