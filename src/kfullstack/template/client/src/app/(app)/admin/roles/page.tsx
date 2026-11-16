"use client";

import { useCallback, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { DataTable, formatDate, usePaged, type Column } from "@/components/admin/data-table";
import { FieldLabel, FormError } from "@/components/auth/auth-card";
import { PageHeader } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/api/client";
import { adminApi, type Role } from "@/lib/api/services";

type Draft = { id?: number; name: string; status: number; remark: string };

const PROTECTED = ["admin", "user"];

export default function AdminRolesPage() {
    const fetcher = useCallback((p: { page: number; size: number }) => adminApi.roles(p), []);
    const paged = usePaged(fetcher);
    const [draft, setDraft] = useState<Draft | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function save(e: FormEvent) {
        e.preventDefault();
        if (!draft) return;
        setSaving(true);
        setError(null);
        const body = { name: draft.name.trim(), status: draft.status, remark: draft.remark || null };
        try {
            if (draft.id) await adminApi.updateRole(draft.id, body);
            else await adminApi.createRole(body);
            toast.success(draft.id ? "Role updated" : "Role created");
            setDraft(null);
            await paged.reload();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    async function remove(role: Role) {
        if (!window.confirm(`Delete role "${role.name}"?`)) return;
        try {
            await adminApi.deleteRoles([role.id]);
            toast.success("Role deleted");
            await paged.reload();
        } catch (err) {
            toast.error(errorMessage(err));
        }
    }

    const columns: Column<Role>[] = [
        { header: "Name", cell: r => <span className="font-medium text-primary">{r.name}</span> },
        {
            header: "Status",
            cell: r => (
                <Badge size="sm" color={r.status ? "success" : "gray"}>
                    {r.status ? "Enabled" : "Disabled"}
                </Badge>
            ),
        },
        { header: "Note", cell: r => r.remark || "—" },
        { header: "Created", cell: r => formatDate(r.created_time) },
        {
            header: "",
            className: "text-right",
            cell: r => (
                <div className="flex justify-end gap-2">
                    <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => {
                            setError(null);
                            setDraft({ id: r.id, name: r.name, status: r.status, remark: r.remark ?? "" });
                        }}
                    >
                        Edit
                    </Button>
                    {!PROTECTED.includes(r.name) && (
                        <Button variant="tertiary-destructive" size="sm" onClick={() => remove(r)}>
                            Delete
                        </Button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <>
            <PageHeader
                title="Roles"
                description="Users with the admin role can access this space."
                action={
                    <Button
                        size="md"
                        onClick={() => {
                            setError(null);
                            setDraft({ name: "", status: 1, remark: "" });
                        }}
                    >
                        New role
                    </Button>
                }
            />
            <DataTable columns={columns} paged={paged} empty="No roles yet." />

            <Dialog
                open={draft !== null}
                onOpenChange={open => !open && setDraft(null)}
                title={draft?.id ? "Edit role" : "New role"}
                content={
                    draft && (
                        <form onSubmit={save} className="space-y-4">
                            <div>
                                <FieldLabel htmlFor="role-name">Name</FieldLabel>
                                <Input
                                    id="role-name"
                                    value={draft.name}
                                    onChange={e => setDraft({ ...draft, name: e.target.value })}
                                    required
                                    disabled={!!draft.id && PROTECTED.includes(draft.name)}
                                />
                            </div>
                            <div>
                                <FieldLabel htmlFor="role-remark">Note</FieldLabel>
                                <Input
                                    id="role-remark"
                                    value={draft.remark}
                                    onChange={e => setDraft({ ...draft, remark: e.target.value })}
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-secondary">
                                <input
                                    type="checkbox"
                                    checked={draft.status === 1}
                                    onChange={e => setDraft({ ...draft, status: e.target.checked ? 1 : 0 })}
                                />
                                Enabled
                            </label>
                            <FormError message={error} />
                            <div className="flex justify-end gap-2">
                                <Button variant="secondary" onClick={() => setDraft(null)}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={saving}>
                                    Save
                                </Button>
                            </div>
                        </form>
                    )
                }
            />
        </>
    );
}
