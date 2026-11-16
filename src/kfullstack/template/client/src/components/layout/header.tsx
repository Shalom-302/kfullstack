"use client";

import Link from "next/link";
import { Menu01 } from "@untitled-ui/icons-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { displayName } from "@/lib/api/services";
import { useAuth } from "@/lib/auth/auth-context";

export function AppHeader({ onMenu }: { onMenu: () => void }) {
    const { user, isAdmin } = useAuth();
    const name = displayName(user);

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-secondary bg-primary/90 px-4 backdrop-blur md:px-8">
            <button
                type="button"
                onClick={onMenu}
                className="rounded-md p-2 text-fg-quaternary hover:bg-primary_hover md:hidden"
                aria-label="Open menu"
            >
                <Menu01 className="size-5" />
            </button>
            <div className="flex-1" />
            <ThemeToggle />
            <Link
                href="/profile"
                className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-primary_hover"
            >
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-solid text-sm font-semibold text-white">
                    {name.charAt(0).toUpperCase() || "U"}
                </span>
                <span className="hidden text-sm sm:block">
                    <span className="block font-semibold text-primary">{name}</span>
                    <span className="block text-xs text-tertiary">{isAdmin ? "Administrator" : "User"}</span>
                </span>
            </Link>
        </header>
    );
}
