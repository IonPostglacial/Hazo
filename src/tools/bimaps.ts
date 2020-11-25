import { IMap } from '@/bunga/hierarchy';

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

function addUniqueElementToMap(elementsByKey: IMap<string[]>, key: string, element: string) {
    let elements = elementsByKey.get(key);
    if (typeof elements === "undefined") {
        elements = [];
    }
    addUniqueElementToArray(elements, element);
    elementsByKey.set(key, elements);
}

function removeUniqueElementFromMap(elementsByKey: IMap<string[]>, key: string, element: string) {
    const elements = elementsByKey.get(key);
    if (typeof elements !== "undefined") {
        removeUniqueElementFromArray(elements, element);
    }
}

export class OneToManyBimap {
    private rightIdsByLeftIds: IMap<string[]>;
    private leftIdByRightIds: IMap<string>;

    constructor(makeMap: { new(): IMap<any> }) {
        this.rightIdsByLeftIds = new makeMap();
        this.leftIdByRightIds = new makeMap();
    }

    add(leftId: string, rightId: string) {
        addUniqueElementToMap(this.rightIdsByLeftIds, leftId, rightId);
        this.leftIdByRightIds.set(rightId, leftId);
    }

    remove(leftId: string, rightId: string) {
        removeUniqueElementFromMap(this.rightIdsByLeftIds, leftId, rightId);
        this.leftIdByRightIds.delete(rightId);
    }

    removeLeft(leftId: string) {
        this.rightIdsByLeftIds.delete(leftId);
        for (const rightId of Object.keys(this.leftIdByRightIds)) {
            if (this.leftIdByRightIds.get(rightId) === leftId) {
                this.leftIdByRightIds.delete(rightId);
            }
        }
    }

    removeRight(rightId: string) {
        this.leftIdByRightIds.delete(rightId);
        for (const rightIds of Object.values(this.rightIdsByLeftIds)) {
            removeUniqueElementFromArray(rightIds, rightId);
        }
    }

    rightIdsGroupedByLeftId(): Iterable<[string, string[]]> {
        return Object.entries(this.rightIdsByLeftIds);
    }

    getRightIdsByLeftId(leftId: string): readonly string[]|undefined {
        return this.rightIdsByLeftIds.get(leftId);
    }

    getLeftIdByRightId(rightId: string): string|undefined {
        return this.leftIdByRightIds.get(rightId);
    }
}

export class ManyToManyBimap {
    private rightIdsByLeftIds: IMap<string[]>;
    private leftIdsByRightIds: IMap<string[]>;

    constructor(makeMap: { new(): IMap<string[]> }) {
        this.rightIdsByLeftIds = new makeMap();
        this.leftIdsByRightIds = new makeMap();
    }

    has(leftId: string, rightId: string): boolean {
        return this.leftIdsByRightIds.get(rightId)?.includes(leftId) ?? false;
    }

    add(leftId: string, rightId: string) {
        addUniqueElementToMap(this.rightIdsByLeftIds, leftId, rightId);
        addUniqueElementToMap(this.leftIdsByRightIds, rightId, leftId);
    }

    remove(leftId: string, rightId: string) {
        removeUniqueElementFromMap(this.rightIdsByLeftIds, leftId, rightId);
        removeUniqueElementFromMap(this.leftIdsByRightIds, rightId, leftId);
    }

    removeLeft(leftId: string) {
        this.rightIdsByLeftIds.delete(leftId);
        for (const leftIds of Object.values(this.leftIdsByRightIds)) {
            removeUniqueElementFromArray(leftIds, leftId);
        }
    }

    removeRight(rightId: string) {
        this.leftIdsByRightIds.delete(rightId);
        for (const rightIds of Object.values(this.rightIdsByLeftIds)) {
            removeUniqueElementFromArray(rightIds, rightId);
        }
    }

    getRightIdsByLeftId(leftId: string): readonly string[]|undefined {
        return this.rightIdsByLeftIds.get(leftId);
    }

    getLeftIdsByRightId(rightId: string): readonly string[]|undefined {
        return this.leftIdsByRightIds.get(rightId);
    }
}