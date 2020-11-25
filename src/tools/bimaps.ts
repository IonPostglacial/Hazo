function addUniqueElementToArray(elements: string[], element: string) {
    if (!elements.includes(element)) {
        elements.push(element);
    }
}

function removeUniqueElementFromArray(elements: string[], element: string) {
    const index = elements.indexOf(element);
    if (index >= 0) {
        elements.splice(index, 1);
    }
}

function addUniqueElementToRecord(elementsByKey: Record<string, string[]>, key: string, element: string) {
    let elements = elementsByKey[key];
    if (typeof elements === "undefined") {
        elements = [];
    }
    addUniqueElementToArray(elements, element);
    elementsByKey[key] = elements;
}

function removeUniqueElementFromRecord(elementsByKey: Record<string, string[]>, key: string, element: string) {
    const elements = elementsByKey[key];
    if (typeof elements !== "undefined") {
        removeUniqueElementFromArray(elements, element);
    }
}

export class OneToManyBimap {
    private rightIdsByLeftIds: Record<string, string[]>;
    private leftIdByRightIds: Record<string, string>;

    constructor() {
        this.rightIdsByLeftIds = {};
        this.leftIdByRightIds = {};
    }

    add(leftId: string, rightId: string) {
        addUniqueElementToRecord(this.rightIdsByLeftIds, leftId, rightId);
        this.leftIdByRightIds[rightId] = leftId;
    }

    remove(leftId: string, rightId: string) {
        removeUniqueElementFromRecord(this.rightIdsByLeftIds, leftId, rightId);
        delete this.leftIdByRightIds[rightId];
    }

    removeLeft(leftId: string) {
        delete this.rightIdsByLeftIds[leftId];
        for (const rightId of Object.keys(this.leftIdByRightIds)) {
            if (this.leftIdByRightIds[rightId] === leftId) {
                delete this.leftIdByRightIds[rightId];
            }
        }
    }

    removeRight(rightId: string) {
        delete this.leftIdByRightIds[rightId];
        for (const rightIds of Object.values(this.rightIdsByLeftIds)) {
            removeUniqueElementFromArray(rightIds, rightId);
        }
    }

    rightIdsGroupedByLeftId(): Iterable<[string, string[]]> {
        return Object.entries(this.rightIdsByLeftIds);
    }

    getRightIdsByLeftId(leftId: string): readonly string[] {
        return this.rightIdsByLeftIds[leftId];
    }

    getLeftIdByRightId(rightId: string): string {
        return this.leftIdByRightIds[rightId];
    }
}

export class ManyToManyBimap {
    private rightIdsByLeftIds: Record<string, string[]>;
    private leftIdsByRightIds: Record<string, string[]>;

    constructor() {
        this.rightIdsByLeftIds = {};
        this.leftIdsByRightIds = {};
    }

    add(leftId: string, rightId: string) {
        addUniqueElementToRecord(this.rightIdsByLeftIds, leftId, rightId);
        addUniqueElementToRecord(this.leftIdsByRightIds, rightId, leftId);
    }

    remove(leftId: string, rightId: string) {
        removeUniqueElementFromRecord(this.rightIdsByLeftIds, leftId, rightId);
        removeUniqueElementFromRecord(this.leftIdsByRightIds, rightId, leftId);
    }

    removeLeft(leftId: string) {
        delete this.rightIdsByLeftIds[leftId];
        for (const leftIds of Object.values(this.leftIdsByRightIds)) {
            removeUniqueElementFromArray(leftIds, leftId);
        }
    }

    removeRight(rightId: string) {
        delete this.leftIdsByRightIds[rightId];
        for (const rightIds of Object.values(this.rightIdsByLeftIds)) {
            removeUniqueElementFromArray(rightIds, rightId);
        }
    }

    getRightIdsByLeftId(leftId: string): readonly string[] {
        return this.rightIdsByLeftIds[leftId];
    }

    getLeftIdsByRightId(rightId: string): readonly string[] {
        return this.leftIdsByRightIds[rightId];
    }
}