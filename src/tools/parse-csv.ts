export default function parseCSV(str: string, sep: string = ",") {
    const arr:string[][] = [];
    let quote = false;


    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        const cc = str[c], nc = str[c+1];
        arr[row] = arr[row] || [];
        arr[row][col] = arr[row][col] || '';

        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }  
        if (cc == '"') { quote = !quote; continue; }
        if (cc == sep && !quote) { ++col; continue; }
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }

        arr[row][col] += cc;
    }
    return arr;
}

export function csvEscape(value: string|number, sep: string = ","): string {
    if (typeof value === "string") {
        if (value.includes(sep)) {
            return `"${value}"`;
        } else {
            return value;
        }
    }
    return ""+value;
}

export function generateCSV(table: (number|string)[][], sep: string = ","): string {
    return table.map(line => line.map(col => csvEscape(col)).join(sep)).join("\r\n");
}