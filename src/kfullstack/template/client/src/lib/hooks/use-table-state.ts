"use client";

import { useCallback, useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { SortingState, PaginationState, ColumnFiltersState } from "@tanstack/react-table";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PAGE_SIZE_OPTIONS } from "../constants/pagination";

export interface TableUrlConfig {
    prefix?: string;
    sortParam?: string;
    orderParam?: string;
    searchParam?: string;
    pageParam?: string;
    pageSizeParam?: string;
    /**
     * IDs des filtres dont les valeurs sont des tableaux d'IDs (combobox multi-select).
     * Ces filtres sont sérialisés individuellement dans l'URL sous forme lisible :
     *   ?contracts_ra=id1,id2&contracts_clients=id3
     * plutôt qu'en JSON encodé.
     *
     * Les autres filtres (complexes, non listés ici) restent en JSON encodé.
     */
    arrayFilterIds?: string[];
    /**
     * IDs des filtres dont la valeur est une chaîne simple (ex: archiveStatus, theme).
     * Sérialisés directement dans l'URL : ?archiveStatus=nonArchived
     */
    stringFilterIds?: string[];
}

export function useTableState(
    options: {
        urlConfig?: TableUrlConfig;
        initialPageSize?: number;
    } = {}
) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const config = options.urlConfig ?? {};
    const prefix = config.prefix ? `${config.prefix}_` : "";
    const initialPageSize = options.initialPageSize ?? PAGE_SIZE_OPTIONS[0];

    const sortParam = config.sortParam ?? `${prefix}sort`;
    const orderParam = config.orderParam ?? `${prefix}order`;
    const searchParam = config.searchParam ?? `${prefix}q`;
    const pageParam = config.pageParam ?? `${prefix}page`;
    const pageSizeParam = config.pageSizeParam ?? `${prefix}limit`;
    // Filtres tableau sérialisés lisiblement dans l'URL (ex: ra, clients, cpbc)
    const arrayFilterIds = useMemo(() => config.arrayFilterIds ?? [], [config.arrayFilterIds]);
    // Filtres chaîne simple (ex: archiveStatus, theme)
    const stringFilterIds = useMemo(() => config.stringFilterIds ?? [], [config.stringFilterIds]);

    // ── Lecture URL au montage uniquement ─────────────────────────────────────
    const initialSearchParams = useRef(searchParams);

    const [sorting, setSortingState] = useState<SortingState>(() => {
        const sort = initialSearchParams.current.get(sortParam);
        const order = initialSearchParams.current.get(orderParam);
        return sort ? [{ id: sort, desc: order === "desc" }] : [];
    });

    const [search, setSearchState] = useState(
        () => initialSearchParams.current.get(searchParam) ?? ""
    );

    const [pagination, setPagination] = useState<PaginationState>(() => {
        const rawPage = initialSearchParams.current.get(pageParam);
        const rawSize = initialSearchParams.current.get(pageSizeParam);
        return {
            pageIndex: rawPage ? Math.max(0, Number(rawPage) - 1) : 0,
            pageSize: rawSize ? Number(rawSize) : initialPageSize,
        };
    });

    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(() => {
        const filters: ColumnFiltersState = [];

        // Filtres tableau lisibles : ?contracts_ra=id1,id2
        for (const id of arrayFilterIds) {
            const raw = initialSearchParams.current.get(`${prefix}${id}`);
            if (raw) {
                const ids = raw.split(",").filter(Boolean);
                if (ids.length > 0) filters.push({ id, value: ids });
            }
        }

        // Filtres chaîne simple : ?archiveStatus=nonArchived
        for (const id of stringFilterIds) {
            const raw = initialSearchParams.current.get(`${prefix}${id}`);
            if (raw) filters.push({ id, value: raw });
        }

        return filters;
    });

    const debouncedSearch = useDebounce(search, 300);

    // ── Ref searchParams pour éviter les boucles ──────────────────────────────
    const searchParamsRef = useRef(searchParams);
    useEffect(() => {
        searchParamsRef.current = searchParams;
    }, [searchParams]);

    // ── Mise à jour de l'URL ──────────────────────────────────────────────────
    const updateUrl = useCallback(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString());

        // Tri
        if (sorting.length > 0) {
            params.set(sortParam, sorting[0].id);
            params.set(orderParam, sorting[0].desc ? "desc" : "asc");
        } else {
            params.delete(sortParam);
            params.delete(orderParam);
        }

        // Recherche
        if (debouncedSearch) {
            params.set(searchParam, debouncedSearch);
        } else {
            params.delete(searchParam);
        }

        // Page — page 1 omise
        if (pagination.pageIndex > 0) {
            params.set(pageParam, (pagination.pageIndex + 1).toString());
        } else {
            params.delete(pageParam);
        }

        // PageSize — valeur par défaut omise
        if (pagination.pageSize !== initialPageSize) {
            params.set(pageSizeParam, pagination.pageSize.toString());
        } else {
            params.delete(pageSizeParam);
        }

        // Filtres tableau — sérialisés lisiblement : ?contracts_ra=id1,id2
        // On nettoie d'abord tous les params de filtres tableau connus
        for (const id of arrayFilterIds) {
            const paramKey = `${prefix}${id}`;
            const filter = columnFilters.find(f => f.id === id);
            const value = filter?.value as string[] | undefined;

            if (value && value.length > 0) {
                params.set(paramKey, value.join(","));
            } else {
                params.delete(paramKey);
            }
        }

        // Filtres chaîne simple : ?archiveStatus=nonArchived
        for (const id of stringFilterIds) {
            const paramKey = `${prefix}${id}`;
            const filter = columnFilters.find(f => f.id === id);
            const value = filter?.value as string | undefined;
            if (value) {
                params.set(paramKey, value);
            } else {
                params.delete(paramKey);
            }
        }

        const newQuery = params.toString();
        if (newQuery === searchParamsRef.current.toString()) return;

        router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
    }, [
        columnFilters,
        debouncedSearch,
        pagination,
        sorting,
        arrayFilterIds,
        stringFilterIds,
        pathname,
        router,
        sortParam,
        orderParam,
        searchParam,
        pageParam,
        pageSizeParam,
        prefix,
        initialPageSize,
    ]);

    // ── Synchronisation URL ───────────────────────────────────────────────────
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        updateUrl();
    }, [updateUrl]);

    // ── Setters publics avec reset page ───────────────────────────────────────

    const setSorting = useCallback(
        (updater: SortingState | ((prev: SortingState) => SortingState)) => {
            setSortingState(updater);
            setPagination(prev => ({ ...prev, pageIndex: 0 }));
        },
        []
    );

    const setSearch = useCallback((value: string) => {
        setSearchState(value);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, []);

    const setColumnFilter = useCallback((id: string, value: unknown) => {
        setColumnFilters(prev => {
            const next = prev.filter(f => f.id !== id);
            const isEmpty =
                value === undefined ||
                value === null ||
                (Array.isArray(value) && value.length === 0) ||
                value === "";
            if (!isEmpty) next.push({ id, value });
            return next;
        });
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    }, []);

    /** Supprime de l'URL tous les paramètres gérés par cette instance. */
    const clearUrlParams = useCallback(() => {
        const params = new URLSearchParams(searchParamsRef.current.toString());

        for (const key of [sortParam, orderParam, searchParam, pageParam, pageSizeParam]) {
            params.delete(key);
        }
        for (const id of arrayFilterIds) params.delete(`${prefix}${id}`);
        for (const id of stringFilterIds) params.delete(`${prefix}${id}`);

        const newQuery = params.toString();
        router.replace(newQuery ? `${pathname}?${newQuery}` : pathname, { scroll: false });
    }, [
        sortParam,
        orderParam,
        searchParam,
        pageParam,
        pageSizeParam,
        arrayFilterIds,
        stringFilterIds,
        prefix,
        pathname,
        router,
    ]);
    return {
        sorting,
        setSorting,
        search,
        setSearch,
        pagination,
        setPagination,
        columnFilters,
        setColumnFilters,
        setColumnFilter,
        clearUrlParams,
        pageParam,
        pageSizeParam,
    };
}
