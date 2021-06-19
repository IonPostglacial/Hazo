export default {
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