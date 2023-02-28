type OpenAllHandler = () => void;
type CloseAllHandler = () => void;
type ToggleHandler = (menuItemId: string) => void;

export function createMenuEventHub() {
    const _openAllHandlers = new Set<OpenAllHandler>();
    const _closeAllHandlers = new Set<CloseAllHandler>();
    const _toggleHandlers = new Set<ToggleHandler>();

    function _dispatch<T>(handlers: Set<(data: T) => void>, data: T) {
        for (const handler of handlers) {
            handler(data);
        }
    }
    return {
        emitOpenAll() {
            _dispatch(_openAllHandlers, undefined);
        },
        emitCloseAll() {
            _dispatch(_closeAllHandlers, undefined);
        },
        emitToggle(menuItemId: string) {
            _dispatch(_toggleHandlers, menuItemId);
        },
        onOpenAll(handler: OpenAllHandler) {
            _openAllHandlers.add(handler);
        },
        onCloseAll(handler: CloseAllHandler) {
            _closeAllHandlers.add(handler);
        },
        onToggle(handler: ToggleHandler) {
            _toggleHandlers.add(handler);
        },
    }
}

export type MenuEventHub = ReturnType<typeof createMenuEventHub>;