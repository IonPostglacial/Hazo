type OpenAllHandler = () => void;
type CloseAllHandler = () => void;
type ToggleHandler = (menuItemId: string) => void;

export class MenuEventHub {
    private _openAllHandlers = new Set<OpenAllHandler>();
    private _closeAllHandlers = new Set<CloseAllHandler>();
    private _toggleHandlers = new Set<ToggleHandler>();

    private _dispatch<T>(handlers: Set<(data: T) => void>, data: T) {
        for (const handler of handlers) {
            handler(data);
        }
    }

    constructor() {}

    emitOpenAll() {
        this._dispatch(this._openAllHandlers, undefined);
    }

    emitCloseAll() {
        this._dispatch(this._closeAllHandlers, undefined);
    }

    emitToggle(menuItemId: string) {
        this._dispatch(this._toggleHandlers, menuItemId);
    }

    onOpenAll(handler: OpenAllHandler) {
        this._openAllHandlers.add(handler);
    }

    onCloseAll(handler: CloseAllHandler) {
        this._closeAllHandlers.add(handler);
    }

    onToggle(handler: ToggleHandler) {
        this._toggleHandlers.add(handler);
    }
}