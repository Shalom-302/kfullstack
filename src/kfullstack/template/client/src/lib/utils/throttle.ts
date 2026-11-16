export function throttle<T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastRan: number | null = null;

    const throttled = function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        lastArgs = args;
        const now = Date.now();

        // Si c'est le premier appel ou si le délai est écoulé
        if (!lastRan || now - lastRan >= delay) {
            func.call(this, ...args);
            lastRan = now;
            lastArgs = null;
        } else if (!timeoutId) {
            // Programmer un appel pour la fin du délai avec les derniers args
            const remaining = delay - (now - lastRan);
            timeoutId = setTimeout(() => {
                if (lastArgs) {
                    func.call(this, ...lastArgs);
                    lastRan = Date.now();
                }
                timeoutId = null;
                lastArgs = null;
            }, remaining);
        }
    } as T;

    (throttled as T & { cancel: () => void }).cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        lastArgs = null;
        lastRan = null;
    };

    return throttled as T & { cancel: () => void };
}
