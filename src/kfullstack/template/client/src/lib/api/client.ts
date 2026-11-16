// HTTP client for the backend API.
//
// Contract (shaapi backend):
// - every response is an envelope `{ code, msg, data }`; errors carry a
//   translated `msg` that we surface to the user;
// - `Authorization: Bearer <access token>`;
// - the refresh token is an httpOnly cookie set by the API; POST
//   /auth/token/new (with the old access token) rotates both tokens.
import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { siteConfig } from "@/config/site";
import { tokenStore } from "@/lib/auth/token-store";

export type ApiEnvelope<T> = { code: number; msg: string; data: T };

export type Page<T> = {
    items: T[];
    total: number;
    page: number;
    size: number;
    total_pages: number;
};

export class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
    }
}

export const http = axios.create({
    baseURL: siteConfig.apiBasePath,
    withCredentials: true,
    headers: { "Content-Type": "application/json", locale: siteConfig.locale },
});

http.interceptors.request.use(config => {
    const token = tokenStore.get();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
    return config;
});

// Paths that must never trigger a refresh-and-retry.
const NO_REFRESH = ["/auth/login", "/auth/register", "/auth/token/new", "/auth/whatsapp"];

let refreshing: Promise<string | null> | null = null;

/** Single-flight refresh: concurrent 401s share one /auth/token/new call. */
export function refreshAccessToken(): Promise<string | null> {
    if (!refreshing) {
        refreshing = (async () => {
            const old = tokenStore.get();
            if (!old) return null;
            try {
                const res = await axios.post<ApiEnvelope<{ access_token: string }>>(
                    `${siteConfig.apiBasePath}/auth/token/new`,
                    null,
                    { withCredentials: true, headers: { Authorization: `Bearer ${old}` } }
                );
                const token = res.data.data.access_token;
                tokenStore.set(token);
                return token;
            } catch {
                tokenStore.clear();
                return null;
            } finally {
                setTimeout(() => (refreshing = null), 0);
            }
        })();
    }
    return refreshing;
}

http.interceptors.response.use(
    response => response,
    async (error: AxiosError<ApiEnvelope<unknown>>) => {
        const config = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
        const url = config?.url ?? "";
        if (
            error.response?.status === 401 &&
            config &&
            !config._retried &&
            !NO_REFRESH.some(p => url.startsWith(p))
        ) {
            config._retried = true;
            const token = await refreshAccessToken();
            if (token) return http(config);
            if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
                const next = encodeURIComponent(window.location.pathname);
                window.location.href = `/auth/login?next=${next}`;
            }
        }
        const status = error.response?.status ?? 0;
        const msg =
            error.response?.data?.msg ||
            (status === 0 ? "Network error, check your connection." : error.message);
        return Promise.reject(new ApiError(msg, status));
    }
);

/** Unwrap `{code, msg, data}` and return `data`. */
export async function api<T>(config: AxiosRequestConfig): Promise<T> {
    const res = await http.request<ApiEnvelope<T>>(config);
    return res.data.data;
}

export function errorMessage(err: unknown, fallback = "Something went wrong."): string {
    if (err instanceof ApiError) return err.message;
    if (err instanceof Error) return err.message;
    return fallback;
}
