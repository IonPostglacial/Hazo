export function escape(value: string|number|undefined): string {
    if (typeof value === "string") {
        if (value.includes('"')) {
            return `"${value.replaceAll('"', '""')}"`;
        } else if (value.includes(",") || value.includes("\n")) {
            return `"${value}"`;
        } else {
            return value;
        }
    } else if (typeof value === "undefined") {
        return "";
    }
    return ""+value;
}

export default function parseCSV(str: string) {
    const arr:string[][] = [];
    let quote = false;

    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        const cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';

        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  
        if (cc == '"') { quote = !quote; continue; }
        if (cc == ',' && !quote) { ++col; continue; }
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }
        arr[row][col] += cc;
    }
    return arr;
}

export function transposeCSV(lines: string[][]): string[][] {
    const columns: string[][] = [];
    if (lines.length > 0) {
        for (let i = 0; i < lines[0].length; i++) {
            const col = [];
            for (let j = 0; j < lines.length; j++) {
                col.push("");
            }
            columns.push(col);
        }
        for (let line = 0; line < lines.length; line++) {
            for (let col = 0; col < lines[0].length; col++) {
                columns[col][line] = lines[line][col];
            }
        }
    }
    return columns;
}

export type Factor = {
    levels: string[],
    values: number[],
};

export function factorizeColumn(column: string[]): Factor {
    const levelsByValues = new Map<string, number>();
    const values: number[] = [];
    const levels: string[] = [];
    for (const value of column) {
        let level = levelsByValues.get(value);
        if (typeof level === "undefined") {
            level = levelsByValues.size;
            levels.push(value);
            levelsByValues.set(value, level);
        }
        values.push(level);
    }
    return { levels, values };
}