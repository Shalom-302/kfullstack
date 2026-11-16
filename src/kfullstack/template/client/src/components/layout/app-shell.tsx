"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { AppHeader } from "./header";
import { Sidebar } from "./sidebar";

/** Authenticated shell: redirects anonymous visitors to the login page. */
export function AppShell({ children }: { children: ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
        }
    }, [loading, isAuthenticated, pathname, router]);

    if (loading || !isAuthenticated) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-secondary">
                <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary">
            <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
            <div className="md:pl-64">
                <AppHeader onMenu={() => setMenuOpen(true)} />
                <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
            </div>
        </div>
    );
}

export function PageHeader({
    title,
    description,
    action,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
                <h1 className="text-display-xs font-semibold text-primary">{title}</h1>
                {description && <p className="mt-1 text-md text-tertiary">{description}</p>}
            </div>
            {action}
        </div>
    );
}
