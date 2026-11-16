"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { EmailPasswordForm } from "@/components/auth/email-login";
import { WhatsappLogin } from "@/components/auth/whatsapp-login";
import { authApi, isAdmin, type LoginResult } from "@/lib/api/services";
import { safeNext, useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils/cn";

function LoginContent() {
    const router = useRouter();
    const params = useSearchParams();
    const { setSession, isAuthenticated, user } = useAuth();
    const [mode, setMode] = useState<"whatsapp" | "email">("whatsapp");

    const fallback = (u: LoginResult["user"] | null) => (isAdmin(u) ? "/admin" : "/dashboard");

    useEffect(() => {
        if (isAuthenticated) router.replace(safeNext(params.get("next"), fallback(user)));
    }, [isAuthenticated, user, params, router]);

    function onSuccess(result: LoginResult) {
        setSession(result);
        router.replace(safeNext(params.get("next"), fallback(result.user)));
    }

    return (
        <AuthCard
            title="Log in"
            subtitle="Welcome back! Choose how you want to sign in."
            footer={
                <>
                    No account yet?{" "}
                    <Link href="/auth/register" className="font-semibold text-brand-secondary">
                        Sign up
                    </Link>
                </>
            }
        >
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-secondary p-1">
                {(
                    [
                        ["whatsapp", "WhatsApp"],
                        ["email", "Email"],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setMode(value)}
                        className={cn(
                            "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                            mode === value
                                ? "bg-primary text-secondary shadow-sm"
                                : "text-quaternary hover:text-secondary"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {mode === "whatsapp" ? (
                <WhatsappLogin onSuccess={onSuccess} />
            ) : (
                <EmailPasswordForm submitLabel="Log in" onSubmit={authApi.login} onSuccess={onSuccess} />
            )}
        </AuthCard>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginContent />
        </Suspense>
    );
}
