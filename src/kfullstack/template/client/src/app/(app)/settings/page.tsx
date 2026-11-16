"use client";

import { PageHeader } from "@/components/layout/app-shell";
import AppearanceSettings from "@/components/settings/appearance-settings";

export default function SettingsPage() {
    return (
        <>
            <PageHeader title="Settings" description="Personalize your experience." />
            <AppearanceSettings />
        </>
    );
}
