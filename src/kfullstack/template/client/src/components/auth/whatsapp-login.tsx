"use client";

// Passwordless login: WhatsApp number -> one-time code -> session.
// Adapted from the Foody implementation (generic: any country, no pseudo step).
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTPCustom } from "@/components/ui/input/input-otp";
import { errorMessage } from "@/lib/api/client";
import { authApi, type LoginResult } from "@/lib/api/services";
import { FieldLabel, FormError } from "./auth-card";

const CODE_LENGTH = 6;

export function WhatsappLogin({ onSuccess }: { onSuccess: (result: LoginResult) => void }) {
    const [step, setStep] = useState<"phone" | "code">("phone");
    const [phone, setPhone] = useState("");
    const [normalized, setNormalized] = useState("");
    const [code, setCode] = useState("");
    const [resendIn, setResendIn] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (resendIn <= 0) return;
        const t = setTimeout(() => setResendIn(s => s - 1), 1000);
        return () => clearTimeout(t);
    }, [resendIn]);

    async function sendCode(e?: FormEvent) {
        e?.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await authApi.requestOtp(phone);
            setNormalized(res.phone);
            setResendIn(res.resend_in);
            setCode("");
            setStep("code");
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    async function verify(value: string) {
        if (value.length !== CODE_LENGTH || loading) return;
        setError(null);
        setLoading(true);
        try {
            onSuccess(await authApi.verifyOtp(normalized || phone, value));
        } catch (err) {
            setError(errorMessage(err));
            setCode("");
        } finally {
            setLoading(false);
        }
    }

    if (step === "phone") {
        return (
            <form onSubmit={sendCode} className="space-y-5">
                <div>
                    <FieldLabel htmlFor="phone">WhatsApp number</FieldLabel>
                    <Input
                        id="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+33 6 12 34 56 78"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        size="md"
                    />
                    <p className="mt-1.5 text-sm text-tertiary">
                        International format, with the country code. We will send you a code on
                        WhatsApp.
                    </p>
                </div>
                <FormError message={error} />
                <Button type="submit" size="lg" className="w-full" isLoading={loading}>
                    Receive my code
                </Button>
            </form>
        );
    }

    return (
        <div className="space-y-5">
            <p className="text-sm text-tertiary">
                Enter the {CODE_LENGTH}-digit code sent on WhatsApp to{" "}
                <span className="font-semibold text-secondary">+{normalized}</span>.
            </p>
            <InputOTPCustom.Root size="sm" disabled={loading}>
                <InputOTPCustom.Group
                    maxLength={CODE_LENGTH}
                    value={code}
                    onChange={value => {
                        setCode(value);
                        if (value.length === CODE_LENGTH) void verify(value);
                    }}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="^[0-9]*$"
                    autoFocus
                    containerClassName="justify-center"
                >
                    {Array.from({ length: CODE_LENGTH }, (_, i) => (
                        <InputOTPCustom.Slot key={i} index={i} className="size-12! text-display-xs!" />
                    ))}
                </InputOTPCustom.Group>
            </InputOTPCustom.Root>
            <FormError message={error} />
            <Button
                size="lg"
                className="w-full"
                isLoading={loading}
                isDisabled={code.length !== CODE_LENGTH}
                onClick={() => verify(code)}
            >
                Log in
            </Button>
            <div className="flex items-center justify-between text-sm">
                <button
                    type="button"
                    className="font-semibold text-tertiary hover:text-secondary"
                    onClick={() => {
                        setStep("phone");
                        setError(null);
                    }}
                >
                    Change number
                </button>
                <button
                    type="button"
                    disabled={resendIn > 0 || loading}
                    className="font-semibold text-brand-secondary disabled:text-disabled"
                    onClick={() => sendCode()}
                >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
                </button>
            </div>
        </div>
    );
}
