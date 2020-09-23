export default function clone<T>(value: T): T {
    switch (typeof value) {
        case "object":
            if (typeof (value as any).clone === "function") {
                return (value as any).clone();
            }
            if (Array.isArray(value)) {
                return value.map(subValue => clone(subValue)) as unknown as T;
            }
            return Object.fromEntries(Object.entries(value).filter(kvp => typeof kvp[1] !== "function").map(kvp => [kvp[0], clone(kvp[1] as any)])) as T;
        case "boolean":
        case "number":
        case "string":
        case "undefined":
        case "symbol":
            return value;
        case "function":
            throw "Trying to clone a function";
        default:
            throw "Trying to clone unknown JavaScript type";
    }
}