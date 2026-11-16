"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/api/client";
import type { LoginResult } from "@/lib/api/services";
import { FieldLabel, FormError } from "./auth-card";

export function EmailPasswordForm({
    submitLabel,
    onSubmit,
    onSuccess,
    passwordAutoComplete = "current-password",
}: {
    submitLabel: string;
    onSubmit: (email: string, password: string) => Promise<LoginResult>;
    onSuccess: (result: LoginResult) => void;
    passwordAutoComplete?: "current-password" | "new-password";
}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handle(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            onSuccess(await onSubmit(email.trim(), password));
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handle} className="space-y-5">
            <div>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    size="md"
                />
            </div>
            <div>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                    id="password"
                    type="password"
                    autoComplete={passwordAutoComplete}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={passwordAutoComplete === "new-password" ? 8 : undefined}
                    size="md"
                />
            </div>
            <FormError message={error} />
            <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                {submitLabel}
            </Button>
        </form>
    );
}
