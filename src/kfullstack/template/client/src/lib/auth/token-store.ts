// Access token storage (memory + localStorage so a reload keeps the session).
// The refresh token never reaches JavaScript: it is an httpOnly cookie.
const KEY = "shaapi_access_token";

let memory: string | null = null;

export const tokenStore = {
    get(): string | null {
        if (memory) return memory;
        if (typeof window === "undefined") return null;
        try {
            memory = window.localStorage.getItem(KEY);
        } catch {
            memory = null;
        }
        return memory;
    },
    set(token: string) {
        memory = token;
        try {
            window.localStorage.setItem(KEY, token);
        } catch {
            /* storage unavailable: keep in memory only */
        }
    },
    clear() {
        memory = null;
        try {
            window.localStorage.removeItem(KEY);
        } catch {
            /* ignore */
        }
    },
};
