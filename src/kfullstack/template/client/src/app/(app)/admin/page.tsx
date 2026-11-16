"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { siteConfig } from "@/config/site";
import { adminApi } from "@/lib/api/services";

export default function AdminOverviewPage() {
    const [counts, setCounts] = useState<{ users?: number; roles?: number; logins?: number }>({});

    useEffect(() => {
        const one = { page: 1, size: 1 };
        Promise.allSettled([adminApi.users(one), adminApi.roles(one), adminApi.loginLogs(one)]).then(
            ([u, r, l]) =>
                setCounts({
                    users: u.status === "fulfilled" ? u.value.total : undefined,
                    roles: r.status === "fulfilled" ? r.value.total : undefined,
                    logins: l.status === "fulfilled" ? l.value.total : undefined,
                })
        );
    }, []);

    const cards = [
        { label: "Users", value: counts.users, href: "/admin/users" },
        { label: "Roles", value: counts.roles, href: "/admin/roles" },
        { label: "Logins recorded", value: counts.logins, href: "/admin/logs" },
    ];

    return (
        <>
            <PageHeader
                title="Administration"
                description={`Manage ${siteConfig.name}: users, roles and activity.`}
            />
            <div className="grid gap-4 sm:grid-cols-3">
                {cards.map(c => (
                    <Link
                        key={c.href}
                        href={c.href}
                        className="rounded-xl border border-secondary bg-primary p-5 shadow-xs transition-colors hover:bg-primary_hover"
                    >
                        <p className="text-sm font-medium text-tertiary">{c.label}</p>
                        <p className="mt-2 text-display-sm font-semibold text-primary">
                            {c.value ?? "—"}
                        </p>
                    </Link>
                ))}
            </div>
            <p className="mt-8 text-sm text-tertiary">
                API documentation (dev):{" "}
                <a
                    href="/admin/api/v1/docs"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-secondary"
                >
                    /admin/api/v1/docs
                </a>
            </p>
        </>
    );
}
