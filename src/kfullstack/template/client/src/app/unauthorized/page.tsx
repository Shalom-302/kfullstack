import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
            <div className="w-full max-w-md rounded-xl border border-secondary bg-primary p-8 text-center shadow-sm">
                <h1 className="text-display-xs font-semibold text-primary">Access denied</h1>
                <p className="mt-2 text-md text-tertiary">
                    You do not have the permissions needed to open this page. Contact an
                    administrator if you think this is a mistake.
                </p>
                <Button asChild size="md" className="mt-6">
                    <Link href="/dashboard">Back to dashboard</Link>
                </Button>
            </div>
        </div>
    );
}
