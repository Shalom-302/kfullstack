"use client";

import Link from "next/link";
import {
    MessageChatCircle,
    ShieldTick,
    Users01,
    Server01,
    Lock01,
    Container,
} from "@untitled-ui/icons-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/lib/auth/auth-context";

const features = [
    {
        icon: MessageChatCircle,
        title: "WhatsApp login",
        text: "Passwordless sign-in with a one-time code sent on WhatsApp. Accounts are created on first login.",
    },
    {
        icon: Lock01,
        title: "Email & password",
        text: "Classic sign-up and login, JWT access tokens and rotating httpOnly refresh cookies.",
    },
    {
        icon: ShieldTick,
        title: "Roles & permissions",
        text: "Admin and user spaces, role management and Casbin policies on the API.",
    },
    {
        icon: Users01,
        title: "Admin space",
        text: "Manage users and roles, review login and operation logs.",
    },
    {
        icon: Server01,
        title: "FastAPI backend",
        text: "Async SQLAlchemy, Alembic migrations, Redis, MinIO and OpenAPI docs.",
    },
    {
        icon: Container,
        title: "Docker ready",
        text: "One command to run the whole stack locally, prebuilt images for production.",
    },
];

export default function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="flex min-h-screen flex-col bg-primary">
            <header className="border-b border-secondary">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 md:px-8">
                    <Link href="/" className="text-xl font-bold text-primary">
                        {siteConfig.name}
                    </Link>
                    <div className="flex-1" />
                    <ThemeToggle />
                    {isAuthenticated ? (
                        <Button asChild size="md">
                            <Link href="/dashboard">Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Button asChild variant="tertiary" size="md">
                                <Link href="/auth/login">Log in</Link>
                            </Button>
                            <Button asChild size="md">
                                <Link href="/auth/register">Sign up</Link>
                            </Button>
                        </>
                    )}
                </div>
            </header>

            <main className="flex-1">
                <section className="mx-auto max-w-4xl px-4 py-20 text-center md:py-28">
                    <h1 className="text-display-md font-semibold tracking-tight text-primary md:text-display-xl">
                        Welcome to {siteConfig.name}
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-tertiary md:text-xl">
                        {siteConfig.description}
                    </p>
                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                        <Button asChild size="xl">
                            <Link href={isAuthenticated ? "/dashboard" : "/auth/login"}>
                                {isAuthenticated ? "Open the app" : "Get started"}
                            </Link>
                        </Button>
                        <Button asChild size="xl" variant="secondary">
                            <a href="/admin/api/v1/docs" target="_blank" rel="noreferrer">
                                API docs
                            </a>
                        </Button>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-4 pb-24 md:px-8">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map(f => (
                            <div
                                key={f.title}
                                className="rounded-xl border border-secondary bg-primary p-6 shadow-xs"
                            >
                                <span className="flex size-10 items-center justify-center rounded-lg bg-brand-secondary">
                                    <f.icon className="size-5 text-fg-brand-primary" />
                                </span>
                                <h3 className="mt-4 text-lg font-semibold text-primary">{f.title}</h3>
                                <p className="mt-2 text-md text-tertiary">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-secondary py-8 text-center text-sm text-quaternary">
                © {new Date().getFullYear()} {siteConfig.name}
            </footer>
        </div>
    );
}
