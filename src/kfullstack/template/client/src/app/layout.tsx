import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils/cn";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
    title: { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
    description: siteConfig.description,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang={siteConfig.locale} suppressHydrationWarning className="scroll-smooth">
            <body className={cn(inter.variable, "bg-primary antialiased")} suppressHydrationWarning>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                    <AuthProvider>
                        <Toaster position="top-right" richColors />
                        {children}
                    </AuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
