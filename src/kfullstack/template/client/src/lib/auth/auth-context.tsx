"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { authApi, isAdmin as userIsAdmin, type LoginResult, type User } from "@/lib/api/services";
import { tokenStore } from "./token-store";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    /** Store the session returned by login/register/verify-otp. */
    setSession: (result: LoginResult) => void;
    refreshUser: () => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        if (!tokenStore.get()) {
            setUser(null);
            return;
        }
        try {
            setUser(await authApi.me());
        } catch {
            tokenStore.clear();
            setUser(null);
        }
    }, []);

    useEffect(() => {
        refreshUser().finally(() => setLoading(false));
    }, [refreshUser]);

    const setSession = useCallback((result: LoginResult) => {
        tokenStore.set(result.access_token);
        setUser(result.user);
    }, []);

    const logout = useCallback(async () => {
        try {
            await authApi.logout();
        } catch {
            /* session may already be gone */
        }
        tokenStore.clear();
        setUser(null);
        window.location.href = "/auth/login";
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            isAuthenticated: !!user,
            isAdmin: userIsAdmin(user),
            setSession,
            refreshUser,
            logout,
        }),
        [user, loading, setSession, refreshUser, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}

/** Only allow same-site relative redirects (no open redirect). */
export function safeNext(next: string | null | undefined, fallback = "/dashboard"): string {
    if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/auth")) {
        return fallback;
    }
    return next;
}
