// Central app configuration: name, branding and navigation.
// The generator replaces "Shaapi" with your project name.
import type { ComponentType } from "react";
import {
    Home01,
    User01,
    Settings01,
    Users01,
    ShieldTick,
    ClipboardCheck,
    BarChartSquare02,
} from "@untitled-ui/icons-react";

export type NavItem = {
    name: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
};

export const siteConfig = {
    name: "Shaapi",
    description: "Fullstack application generated with kfullstack: FastAPI + Next.js.",
    locale: "fr",
    // API path, served on the same origin and proxied by the Next server.
    apiBasePath: "/admin/api/v1",
    nav: {
        user: [
            { name: "Dashboard", href: "/dashboard", icon: Home01 },
            { name: "Profile", href: "/profile", icon: User01 },
            { name: "Settings", href: "/settings", icon: Settings01 },
        ] satisfies NavItem[],
        admin: [
            { name: "Overview", href: "/admin", icon: BarChartSquare02 },
            { name: "Users", href: "/admin/users", icon: Users01 },
            { name: "Roles", href: "/admin/roles", icon: ShieldTick },
            { name: "Logs", href: "/admin/logs", icon: ClipboardCheck },
        ] satisfies NavItem[],
    },
};
