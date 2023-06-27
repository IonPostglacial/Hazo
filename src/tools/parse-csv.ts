export function escape(value: string|number|undefined): string {
    if (typeof value === "string") {
        if (value.includes(",")) {
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