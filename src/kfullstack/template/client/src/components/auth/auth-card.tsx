import Link from "next/link";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";

export function AuthCard({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
    footer?: ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-secondary px-4 py-12">
            <div className="w-full max-w-md">
                <Link href="/" className="mb-8 block text-center text-2xl font-bold text-primary">
                    {siteConfig.name}
                </Link>
                <div className="rounded-xl border border-secondary bg-primary p-6 shadow-sm sm:p-8">
                    <h1 className="text-display-xs font-semibold text-primary">{title}</h1>
                    {subtitle && <p className="mt-2 text-md text-tertiary">{subtitle}</p>}
                    <div className="mt-6">{children}</div>
                </div>
                {footer && <div className="mt-6 text-center text-sm text-tertiary">{footer}</div>}
            </div>
        </div>
    );
}

export function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-secondary">
            {children}
        </label>
    );
}

export function FormError({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <p role="alert" className="rounded-lg bg-error-primary px-3 py-2 text-sm text-error-primary">
            {message}
        </p>
    );
}
