"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { EmailPasswordForm } from "@/components/auth/email-login";
import { authApi, type LoginResult } from "@/lib/api/services";
import { useAuth } from "@/lib/auth/auth-context";

export default function RegisterPage() {
    const router = useRouter();
    const { setSession } = useAuth();

    function onSuccess(result: LoginResult) {
        setSession(result);
        router.replace("/dashboard");
    }

    return (
        <AuthCard
            title="Create an account"
            subtitle="Sign up with your email. With WhatsApp, your account is created on first login."
            footer={
                <>
                    Already have an account?{" "}
                    <Link href="/auth/login" className="font-semibold text-brand-secondary">
                        Log in
                    </Link>
                </>
            }
        >
            <EmailPasswordForm
                submitLabel="Create my account"
                onSubmit={authApi.register}
                onSuccess={onSuccess}
                passwordAutoComplete="new-password"
            />
        </AuthCard>
    );
}
