"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { FieldLabel, FormError } from "@/components/auth/auth-card";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/api/client";
import { authApi } from "@/lib/api/services";
import { useAuth } from "@/lib/auth/auth-context";

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setFirstname(user?.firstname ?? "");
        setLastname(user?.lastname ?? "");
    }, [user]);

    async function save(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            await authApi.updateMe({ firstname, lastname });
            await refreshUser();
            toast.success("Profile updated");
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <PageHeader title="Profile" description="Your personal information." />
            <form
                onSubmit={save}
                className="max-w-xl space-y-5 rounded-xl border border-secondary bg-primary p-6 shadow-xs"
            >
                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <FieldLabel htmlFor="firstname">First name</FieldLabel>
                        <Input
                            id="firstname"
                            value={firstname}
                            onChange={e => setFirstname(e.target.value)}
                            maxLength={80}
                            size="md"
                        />
                    </div>
                    <div>
                        <FieldLabel htmlFor="lastname">Last name</FieldLabel>
                        <Input
                            id="lastname"
                            value={lastname}
                            onChange={e => setLastname(e.target.value)}
                            maxLength={80}
                            size="md"
                        />
                    </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input id="email" value={user?.email ?? ""} disabled size="md" />
                    </div>
                    <div>
                        <FieldLabel htmlFor="phone">WhatsApp</FieldLabel>
                        <Input id="phone" value={user?.phone ? `+${user.phone}` : ""} disabled size="md" />
                    </div>
                </div>
                <FormError message={error} />
                <Button type="submit" size="md" isLoading={saving}>
                    Save
                </Button>
            </form>
        </>
    );
}
