const elementAccess = Symbol();

type INode<T extends Node> = {
    [elementAccess]: T;
}

type IElement<T, U extends Node> = INode<U> & {
    [P in keyof T]: T[P]
}

export function $<T extends Node>(node: INode<T>): T {
    return node[elementAccess];
}

export function txt(text: string): INode<Text> {
    return { [elementAccess]: document.createTextNode(text) };
}

export function _<T extends keyof HTMLElementTagNameMap, U extends Record<string, INode<any>>>(tagName: T, attributes: Record<string, any>, children: U): IElement<U, HTMLElementTagNameMap[T]> {
    const element = document.createElement(tagName);
    for (const [attributeName, attributeValue] of Object.entries(attributes)) {
        element.setAttribute(attributeName, attributeValue);
    }
    return { [elementAccess]: element, ...children };
}