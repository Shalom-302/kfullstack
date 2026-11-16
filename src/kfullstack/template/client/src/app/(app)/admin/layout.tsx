"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

/** Admin space: only users holding the `admin` role. The API enforces it too. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAdmin, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAdmin) router.replace("/unauthorized");
    }, [loading, isAdmin, router]);

    if (!isAdmin) return null;
    return <>{children}</>;
}
