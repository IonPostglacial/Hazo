export class SddException {
    constructor(public msg: string) {}

    toString() {
        return `Invalid SDD: ${this.msg}`;
    }
}

export class SddRefException extends SddException {
    constructor(sourceElement: string, targetElement: string, ref: string) {
        super("A '" + sourceElement + "' references a missing '" + targetElement + "': " + ref);
    }
}