"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { displayName } from "@/lib/api/services";
import { useAuth } from "@/lib/auth/auth-context";

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-secondary bg-primary p-5 shadow-xs">
            <p className="text-sm font-medium text-tertiary">{label}</p>
            <p className="mt-2 truncate text-lg font-semibold text-primary">{value}</p>
        </div>
    );
}

export default function DashboardPage() {
    const { user, isAdmin } = useAuth();

    return (
        <>
            <PageHeader
                title={`Hello ${displayName(user)}`}
                description="This is your space. Build your product features here."
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Stat label="Email" value={user?.email || "—"} />
                <Stat label="WhatsApp" value={user?.phone ? `+${user.phone}` : "—"} />
                <Stat label="Roles" value={user?.roles?.map(r => r.name).join(", ") || "—"} />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="secondary" size="md">
                    <Link href="/profile">Edit my profile</Link>
                </Button>
                {isAdmin && (
                    <Button asChild size="md">
                        <Link href="/admin">Go to administration</Link>
                    </Button>
                )}
            </div>
        </>
    );
}
