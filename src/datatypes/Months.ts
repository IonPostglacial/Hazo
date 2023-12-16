import { MultilangText } from "@/datatypes";

const Months = {
    NAMES: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"],
    JAN: 0,
    FEB: 1,
    MAR: 2,
    APR: 3,
    MAY: 4,
    JUN: 5,
    JUL: 6,
    AUG: 7,
    SEP: 8,
    OCT: 9,
    NOV: 10,
    DEC: 11,
    fromStates(currentItems: {id: string, name: MultilangText }[]): number[] {
        let flowering = [];
        for (const item of currentItems) {
            const monthIndex = (Months as any)[item.name.S];
            flowering.push(monthIndex);
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
};

export default Months;