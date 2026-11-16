"use client";

import { useCallback, useState } from "react";
import { DataTable, formatDate, usePaged, type Column } from "@/components/admin/data-table";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { adminApi, displayName, type User } from "@/lib/api/services";

const columns: Column<User>[] = [
    { header: "Name", cell: u => <span className="font-medium text-primary">{displayName(u)}</span> },
    { header: "Email", cell: u => u.email || "—" },
    { header: "WhatsApp", cell: u => (u.phone ? `+${u.phone}` : "—") },
    {
        header: "Roles",
        cell: u => (
            <div className="flex flex-wrap gap-1">
                {(u.roles ?? []).map(r => (
                    <Badge key={r.name} size="sm" color={r.name === "admin" ? "brand" : "gray"}>
                        {r.name}
                    </Badge>
                ))}
            </div>
        ),
    },
    {
        header: "Status",
        cell: u => (
            <Badge size="sm" color={u.status === false ? "error" : "success"}>
                {u.status === false ? "Disabled" : "Active"}
            </Badge>
        ),
    },
    { header: "Joined", cell: u => formatDate(u.join_time) },
];

export default function AdminUsersPage() {
    const [query, setQuery] = useState("");
    const fetcher = useCallback(
        (p: { page: number; size: number }) => adminApi.users({ ...p, query: query || undefined }),
        [query]
    );
    const paged = usePaged(fetcher);

    return (
        <>
            <PageHeader
                title="Users"
                description="Everyone who signed up, by email or WhatsApp."
                action={
                    <div className="w-72">
                        <Input
                            placeholder="Search…"
                            value={query}
                            onChange={e => {
                                setQuery(e.target.value);
                                paged.setPage(1);
                            }}
                        />
                    </div>
                }
            />
            <DataTable columns={columns} paged={paged} empty="No users yet." />
        </>
    );
}
