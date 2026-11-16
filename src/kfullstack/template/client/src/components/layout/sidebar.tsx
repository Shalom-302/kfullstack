"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut01 } from "@untitled-ui/icons-react";
import { siteConfig, type NavItem } from "@/config/site";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils/cn";

function NavSection({
    title,
    items,
    pathname,
    onNavigate,
}: {
    title?: string;
    items: NavItem[];
    pathname: string;
    onNavigate?: () => void;
}) {
    return (
        <div className="space-y-1">
            {title && (
                <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-quaternary">
                    {title}
                </p>
            )}
            {items.map(item => {
                const active =
                    pathname === item.href ||
                    (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                            active
                                ? "bg-active text-secondary_hover"
                                : "text-secondary hover:bg-primary_hover hover:text-secondary_hover"
                        )}
                    >
                        <item.icon className="size-5 text-fg-quaternary" />
                        <span>{item.name}</span>
                    </Link>
                );
            })}
        </div>
    );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const { isAdmin, logout } = useAuth();

    return (
        <>
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-overlay/50 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-secondary bg-primary px-3 py-5 transition-transform md:translate-x-0",
                    open ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <Link href="/" className="px-3 pb-6 text-xl font-bold text-primary">
                    {siteConfig.name}
                </Link>
                <nav className="flex-1 overflow-y-auto">
                    <NavSection items={siteConfig.nav.user} pathname={pathname} onNavigate={onClose} />
                    {isAdmin && (
                        <NavSection
                            title="Administration"
                            items={siteConfig.nav.admin}
                            pathname={pathname}
                            onNavigate={onClose}
                        />
                    )}
                </nav>
                <button
                    type="button"
                    onClick={logout}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
                >
                    <LogOut01 className="size-5 text-fg-quaternary" />
                    Log out
                </button>
                <p className="px-3 pt-4 text-xs text-quaternary">
                    © {new Date().getFullYear()} {siteConfig.name}
                </p>
            </aside>
        </>
    );
}
