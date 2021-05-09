type Identified = {
    id: string;
}

export type Tree<T extends Identified> = {
    nodes: readonly TreeNode<T>[];
    addNode(node: TreeNode<T>, parent?: T): void;
}

export type TreeNode<T extends Identified> = {
    entry: T;
    children: readonly Tree<T>[];
}

type IndexEntry<T extends Identified> = {
    parentNode?: TreeNode<T>;
    node: TreeNode<T>;
}

class ParentMissingException {
    constructor(private parentId: string) {}

    toString(): string {
        return `There is no TreeNode with parent ${this.parentId}`;
    }
}

class NodeMissingException {
    constructor(private nodeId: string) {}

    toString(): string {
        return `There is no TreeNode with id ${this.nodeId}`;
    }
}

class TreeOf<T extends Identified> implements Tree<T> {
    nodes: TreeNode<T>[];
    index: Map<string, IndexEntry<T>>;

    constructor(nodes: TreeNode<T>[]) {
        this.nodes = nodes;
        this.index = new Map();
        for (const node of nodes) {
            this.index.set(node.entry.id, { node });
        }
    }

    addNode(node: TreeNode<T>, parent: T|undefined = undefined) {
        if (parent) {
            const parentNode = this.index.get(parent.id)?.parentNode;
            if (!parentNode) {
                throw new ParentMissingException(parent.id);
            }
            this.index.set(node.entry.id, { parentNode, node });
        } else {
            this.index.set(node.entry.id, { node });
        }
        this.nodes.push(node);
    }

    deleteNode(node: TreeNode<T>) {
        const nodeIndex = this.nodes.findIndex(n => n.entry.id == node.entry.id);
        if (nodeIndex < 0) {
            throw new NodeMissingException(node.entry.id);
        }
        this.nodes.splice(nodeIndex, 1);
        this.index.delete(node.entry.id);
    }
}

export function createTree<T extends Identified>(nodes: TreeNode<T>[]): Tree<T> {
    return new TreeOf<T>(nodes);
}