"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { errorMessage, type Page } from "@/lib/api/client";

export type Column<T> = { header: string; cell: (row: T) => ReactNode; className?: string };

/** Fetches a paginated endpoint and renders a simple table with pagination. */
export function usePaged<T>(
    fetcher: (params: { page: number; size: number }) => Promise<Page<T>>,
    size = 10
) {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Page<T> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            setData(await fetcher({ page, size }));
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [fetcher, page, size]);

    useEffect(() => {
        void load();
    }, [load]);

    return { page, setPage, data, loading, error, reload: load };
}

export function DataTable<T extends { id: number }>({
    columns,
    paged,
    empty = "Nothing to show yet.",
}: {
    columns: Column<T>[];
    paged: ReturnType<typeof usePaged<T>>;
    empty?: string;
}) {
    const { data, loading, error, page, setPage } = paged;
    const rows = data?.items ?? [];
    const totalPages = Math.max(1, data?.total_pages ?? 1);

    return (
        <div className="overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-secondary text-xs font-semibold text-tertiary">
                        <tr>
                            {columns.map(c => (
                                <th key={c.header} className={`px-4 py-3 ${c.className ?? ""}`}>
                                    {c.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-secondary">
                        {error ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-error-primary">
                                    {error}
                                </td>
                            </tr>
                        ) : loading && !data ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-tertiary">
                                    Loading…
                                </td>
                            </tr>
                        ) : rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-8 text-center text-tertiary">
                                    {empty}
                                </td>
                            </tr>
                        ) : (
                            rows.map(row => (
                                <tr key={row.id} className="text-secondary">
                                    {columns.map(c => (
                                        <td key={c.header} className={`px-4 py-3 ${c.className ?? ""}`}>
                                            {c.cell(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-between border-t border-secondary px-4 py-3 text-sm text-tertiary">
                <span>
                    Page {page} / {totalPages} · {data?.total ?? 0} total
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        isDisabled={page <= 1 || loading}
                        onClick={() => setPage(page - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        isDisabled={page >= totalPages || loading}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function formatDate(value?: string | null): string {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}
