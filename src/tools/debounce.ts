export default function debounce<T extends (...args: any[]) => any>(wait: number, func: T) {
	let timeout: number|undefined = undefined;
	return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (typeof timeout !== "undefined") {
            clearTimeout(timeout);
        }
        timeout = window.setTimeout(func.bind(this, ...args), wait);
	};
}