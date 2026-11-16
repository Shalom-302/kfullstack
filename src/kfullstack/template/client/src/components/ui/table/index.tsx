"use client";

import type { ComponentProps, ReactNode } from "react";
import { createContext, isValidElement, useContext, useState, useMemo } from "react";
import {
    ChevronDown,
    ChevronSelectorVertical,
    ChevronUp,
    Copy01,
    Edit01,
    HelpCircle,
    Trash01,
} from "@untitled-ui/icons-react";
import type {
    Column,
    ColumnDef,
    SortingState,
    RowSelectionState,
    Table as TableInstance,
    ColumnFiltersState,
    PaginationState,
    ExpandedState,
    OnChangeFn,
    RowData,
    Row,
    VisibilityState,
} from "@tanstack/react-table";
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getExpandedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { Checkbox } from "../checkbox";
import { DropdownDotsButton, DropdownMenu } from "../dropdown-menu";
import { Tooltip } from "../tooltip";

export type { ColumnDef } from "@tanstack/react-table";
export { createColumnHelper } from "@tanstack/react-table";

/* eslint-disable @typescript-eslint/no-unused-vars */
declare module "@tanstack/react-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
        headClassName?: string;
        cellClassName?: string;
        tooltip?: string;
    }
}

// ─── TableRowActionsDropdown ──────────────────────────────────────────────────

export const TableRowActionsDropdown = ({
    onEdit,
    onCopy,
    onDelete,
}: {
    onEdit?: () => void;
    onCopy?: () => void;
    onDelete?: () => void;
} = {}) => (
    <DropdownMenu
        trigger={<DropdownDotsButton />}
        align="end"
        contentClassName="w-min"
        items={[
            {
                id: "edit",
                label: (
                    <div className="flex items-center gap-2">
                        <Edit01 />
                        <span>Edit</span>
                    </div>
                ),
                onClick: onEdit,
            },
            {
                id: "copy",
                label: (
                    <div className="flex items-center gap-2">
                        <Copy01 />
                        <span>Copy link</span>
                    </div>
                ),
                onClick: onCopy,
            },
            {
                id: "delete",
                label: (
                    <div className="flex items-center gap-2">
                        <Trash01 />
                        <span>Delete</span>
                    </div>
                ),
                variant: "destructive",
                onClick: onDelete,
            },
        ]}
    />
);

// ─── Context ──────────────────────────────────────────────────────────────────

interface TableContextType<TData extends RowData> {
    size: "sm" | "md";
    table: TableInstance<TData>;
    enableRowSelection?: boolean;
    enableMultiRowSelection?: boolean;
}

const TableContext = createContext<TableContextType<RowData> | null>(null);

export function useTableContext<TData extends RowData>() {
    const ctx = useContext(TableContext);
    if (!ctx) throw new Error("useTableContext must be inside TableProvider");
    return ctx as TableContextType<TData>;
}

// ─── TableCard ────────────────────────────────────────────────────────────────

export const TableCard = ({
    children,
    className,
    size = "md",
    title,
    badge,
    description,
    contentTrailing,
    ...props
}: ComponentProps<"div"> & {
    size?: "sm" | "md";
    title: string;
    badge?: ReactNode;
    description?: string;
    contentTrailing?: ReactNode;
}) => {
    return (
        <div
            {...props}
            className={cn(
                "overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary",
                className
            )}
        >
            <div
                className={cn(
                    "relative flex flex-col items-start gap-4 border-b border-secondary bg-primary px-4 md:flex-row",
                    size === "sm" ? "py-4 md:px-5" : "py-5 md:px-6"
                )}
            >
                <div className="flex flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <h2
                            className={cn(
                                "font-semibold text-primary",
                                size === "sm" ? "text-md" : "text-lg"
                            )}
                        >
                            {title}
                        </h2>
                        {badge &&
                            (isValidElement(badge) ? (
                                badge
                            ) : (
                                <Badge color="brand" size="sm">
                                    {badge}
                                </Badge>
                            ))}
                    </div>
                    {description && <p className="text-sm text-tertiary">{description}</p>}
                </div>
                {contentTrailing}
            </div>

            {children}
        </div>
    );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface TableProps<TData extends RowData> extends ComponentProps<"table"> {
    data: TData[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columns: ColumnDef<TData, any>[];
    size?: "sm" | "md";

    // Tri
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
    enableSorting?: boolean;
    manualSorting?: boolean;

    // Sélection
    rowSelection?: RowSelectionState;
    onRowSelectionChange?: OnChangeFn<RowSelectionState>;
    enableRowSelection?: boolean;
    enableMultiRowSelection?: boolean;

    // Filtrage
    columnFilters?: ColumnFiltersState;
    onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
    manualFiltering?: boolean;

    // Recherche globale
    globalFilter?: string;
    onGlobalFilterChange?: OnChangeFn<string>;

    // Visibilité des colonnes
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

    // Pagination
    pagination?: PaginationState;
    onPaginationChange?: OnChangeFn<PaginationState>;
    pageCount?: number;
    manualPagination?: boolean;

    // Expansion
    expanded?: ExpandedState;
    onExpandedChange?: OnChangeFn<ExpandedState>;
    getSubRows?: (originalRow: TData, index: number) => TData[] | undefined;
    getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;

    // Style
    bordered?: boolean;
    alternatingRows?: boolean;
    emptyMessage?: ReactNode;
    isLoading?: boolean;
    skeletonRowCount?: number;

    onRowClick?: (row: Row<TData>, event: React.MouseEvent<HTMLTableRowElement>) => void;
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table<TData extends RowData>({
    data,
    columns,
    size = "md",
    className,

    sorting: controlledSorting,
    onSortingChange,
    enableSorting = true,
    manualSorting = false,

    rowSelection: controlledRowSelection,
    onRowSelectionChange,
    enableRowSelection = false,
    enableMultiRowSelection = true,

    columnFilters: controlledColumnFilters,
    onColumnFiltersChange,
    manualFiltering = false,

    globalFilter,
    onGlobalFilterChange,

    columnVisibility: controlledColumnVisibility,
    onColumnVisibilityChange,

    pagination: controlledPagination,
    onPaginationChange,
    pageCount = -1,
    manualPagination = false,

    expanded: controlledExpanded,
    onExpandedChange,
    getSubRows,
    getRowId,

    bordered = true,
    alternatingRows = false,
    emptyMessage = "No results.",
    isLoading = false,
    skeletonRowCount = 5,

    onRowClick,
    ...props
}: TableProps<TData>) {
    // ── États internes (fallback non-contrôlé) ────────────────────────────────
    const [internalSorting, setInternalSorting] = useState<SortingState>(
        () => controlledSorting ?? []
    );
    const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});
    const [internalColumnFilters, setInternalColumnFilters] = useState<ColumnFiltersState>([]);
    const [internalPagination, setInternalPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const [internalExpanded, setInternalExpanded] = useState<ExpandedState>({});
    const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({});

    // ── Résolution contrôlé / non-contrôlé ───────────────────────────────────
    const isSortingControlled = controlledSorting !== undefined && onSortingChange !== undefined;
    const sorting = isSortingControlled ? controlledSorting : internalSorting;
    const setSorting: OnChangeFn<SortingState> = isSortingControlled
        ? onSortingChange
        : setInternalSorting;

    const rowSelection = controlledRowSelection ?? internalRowSelection;
    const setRowSelection = onRowSelectionChange ?? setInternalRowSelection;

    const columnFilters = controlledColumnFilters ?? internalColumnFilters;
    const setColumnFilters = onColumnFiltersChange ?? setInternalColumnFilters;

    const isPaginationControlled =
        controlledPagination !== undefined && onPaginationChange !== undefined;
    const pagination = isPaginationControlled ? controlledPagination : internalPagination;
    const setPagination: OnChangeFn<PaginationState> = isPaginationControlled
        ? onPaginationChange
        : setInternalPagination;

    const expanded = controlledExpanded ?? internalExpanded;
    const setExpanded = onExpandedChange ?? setInternalExpanded;

    const columnVisibility = controlledColumnVisibility ?? internalColumnVisibility;
    const setColumnVisibility = onColumnVisibilityChange ?? setInternalColumnVisibility;

    // ── Instance TanStack ─────────────────────────────────────────────────────
    const memoizedColumns = useMemo(() => columns, [columns]);
    const memoizedData = useMemo(() => data, [data]);

    const table = useReactTable<TData>({
        data: memoizedData,
        columns: memoizedColumns,
        getCoreRowModel: getCoreRowModel(),
        getRowId,

        getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
        onSortingChange: setSorting,
        manualSorting,
        enableSorting,

        enableRowSelection,
        enableMultiRowSelection,
        onRowSelectionChange: setRowSelection,

        getFilteredRowModel: getFilteredRowModel(),
        onColumnFiltersChange: setColumnFilters,
        manualFiltering,

        globalFilterFn: "includesString",
        onGlobalFilterChange,

        onColumnVisibilityChange: setColumnVisibility,

        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        manualPagination,
        pageCount,

        getExpandedRowModel: getExpandedRowModel(),
        onExpandedChange: setExpanded,
        getSubRows,

        state: {
            sorting,
            rowSelection,
            columnFilters,
            globalFilter,
            columnVisibility,
            pagination,
            expanded,
        },
    });

    const contextValue = useMemo(
        () => ({ size, table, enableRowSelection, enableMultiRowSelection }),
        [size, table, enableRowSelection, enableMultiRowSelection]
    );

    const colSpan = table.getVisibleLeafColumns().length + (enableRowSelection ? 1 : 0);

    return (
        // @ts-expect-error — context générique
        <TableContext.Provider value={contextValue}>
            <div className="overflow-x-auto">
                <table className={cn("w-full overflow-x-hidden", className)} {...props}>
                    <TableHeader
                        bordered={bordered}
                        className={alternatingRows ? "bg-primary" : undefined}
                    >
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {enableRowSelection && (
                                    <TableHead
                                        className={cn(
                                            "relative py-2 pr-0 pl-4",
                                            size === "sm" ? "w-9 md:pl-5" : "w-11 md:pl-6"
                                        )}
                                    >
                                        {enableMultiRowSelection && (
                                            <div className="flex items-start">
                                                <Checkbox
                                                    checked={
                                                        table.getIsAllPageRowsSelected() ||
                                                        (table.getIsSomePageRowsSelected() &&
                                                            "indeterminate")
                                                    }
                                                    onCheckedChange={value =>
                                                        table.toggleAllPageRowsSelected(!!value)
                                                    }
                                                    aria-label="Select all"
                                                />
                                            </div>
                                        )}
                                    </TableHead>
                                )}

                                {headerGroup.headers.map(header => (
                                    <TableHead
                                        key={header.id}
                                        column={header.column}
                                        sortable={header.column.getCanSort()}
                                        className={header.column.columnDef.meta?.headClassName}
                                        tooltip={header.column.columnDef.meta?.tooltip}
                                    >
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef.header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </tr>
                        ))}
                    </TableHeader>

                    <TableBody
                        emptyMessage={emptyMessage}
                        isLoading={isLoading}
                        skeletonRowCount={skeletonRowCount}
                        colSpan={colSpan}
                    >
                        {table.getRowModel().rows.map(row => (
                            <TableRow
                                key={row.id}
                                className={cn(
                                    alternatingRows && "odd:bg-secondary_subtle",
                                    row.getIsSelected() && "bg-secondary",
                                    onRowClick && "cursor-pointer"
                                )}
                                onClick={event => onRowClick?.(row, event)}
                                tabIndex={onRowClick ? 0 : undefined}
                                onKeyDown={
                                    onRowClick
                                        ? e => {
                                              if (e.key === "Enter" || e.key === " ") {
                                                  e.preventDefault();
                                                  onRowClick(
                                                      row,
                                                      e as unknown as React.MouseEvent<HTMLTableRowElement>
                                                  );
                                              }
                                          }
                                        : undefined
                                }
                            >
                                {enableRowSelection && (
                                    <TableCell
                                        className={cn(
                                            "relative py-2 pr-0 pl-4",
                                            size === "sm" ? "md:pl-5" : "md:pl-6"
                                        )}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="flex items-end">
                                            <Checkbox
                                                checked={row.getIsSelected()}
                                                disabled={!row.getCanSelect()}
                                                onCheckedChange={value =>
                                                    row.toggleSelected(!!value)
                                                }
                                                aria-label="Select row"
                                            />
                                        </div>
                                    </TableCell>
                                )}

                                {row.getVisibleCells().map(cell => (
                                    <TableCell
                                        key={cell.id}
                                        className={cell.column.columnDef.meta?.cellClassName}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </table>
            </div>
        </TableContext.Provider>
    );
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

interface TableHeaderProps extends ComponentProps<"thead"> {
    bordered?: boolean;
}

const TableHeader = ({ bordered = true, className, children, ...props }: TableHeaderProps) => {
    const { size } = useTableContext();
    return (
        <thead
            {...props}
            className={cn(
                "relative bg-secondary",
                size === "sm" ? "h-9" : "h-11",
                bordered &&
                    "[&>tr>th]:after:pointer-events-none [&>tr>th]:after:absolute [&>tr>th]:after:inset-x-0 [&>tr>th]:after:bottom-0 [&>tr>th]:after:h-px [&>tr>th]:after:bg-border-secondary [&>tr>th]:focus-visible:after:bg-transparent",
                className
            )}
        >
            {children}
        </thead>
    );
};

interface TableHeadProps<TData> extends ComponentProps<"th"> {
    label?: string;
    tooltip?: string;
    column?: Column<TData, unknown>;
    sortable?: boolean;
}

function TableHead<TData>({
    className,
    tooltip,
    label,
    column,
    sortable = false,
    children,
    ...props
}: TableHeadProps<TData>) {
    const canSort = column?.getCanSort() ?? sortable;
    const sortDirection = column?.getIsSorted();

    const handleSort = () => {
        if (column && canSort) {
            column.toggleSorting();
        }
    };

    return (
        <th
            {...props}
            aria-sort={
                sortDirection === "asc"
                    ? "ascending"
                    : sortDirection === "desc"
                      ? "descending"
                      : "none"
            }
            className={cn(
                "relative p-0 px-6 py-2 outline-hidden focus-visible:z-1 focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-bg-primary focus-visible:ring-inset",
                canSort && "cursor-pointer select-none",
                className
            )}
            onClick={canSort ? handleSort : undefined}
            onKeyDown={
                canSort
                    ? e => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleSort();
                          }
                      }
                    : undefined
            }
            tabIndex={canSort ? 0 : undefined}
        >
            <div className="flex items-center gap-1">
                <div className="flex items-center gap-1">
                    {label && (
                        <span className="text-xs font-semibold whitespace-nowrap text-quaternary">
                            {label}
                        </span>
                    )}
                    {children}
                </div>

                {tooltip && (
                    <Tooltip
                        trigger={
                            <HelpCircle className="size-4 cursor-pointer text-fg-quaternary transition duration-100 ease-linear hover:text-fg-quaternary_hover focus:text-fg-quaternary_hover" />
                        }
                        title={tooltip}
                    />
                )}

                {canSort &&
                    (sortDirection ? (
                        sortDirection === "asc" ? (
                            <ChevronUp
                                strokeWidth={3}
                                className="size-3 text-fg-quaternary shrink-0"
                            />
                        ) : (
                            <ChevronDown
                                strokeWidth={3}
                                className="size-3 text-fg-quaternary shrink-0"
                            />
                        )
                    ) : (
                        <ChevronSelectorVertical
                            strokeWidth={3}
                            className="size-3 text-fg-quaternary shrink-0"
                        />
                    ))}
            </div>
        </th>
    );
}

const TableRow = ({ className, children, ...props }: ComponentProps<"tr">) => {
    const { size } = useTableContext();
    return (
        <tr
            {...props}
            className={cn(
                "relative outline-focus-ring transition-colors after:pointer-events-none hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2",
                size === "sm" ? "h-14" : "h-18",
                "[&>td]:after:absolute [&>td]:after:inset-x-0 [&>td]:after:bottom-0 [&>td]:after:h-px [&>td]:after:w-full [&>td]:after:bg-border-secondary last:[&>td]:after:hidden [&>td]:focus-visible:after:opacity-0 focus-visible:[&>td]:after:opacity-0",
                className
            )}
        >
            {children}
        </tr>
    );
};

const TableCell = ({ className, children, ...props }: ComponentProps<"td">) => {
    const { size } = useTableContext();
    return (
        <td
            {...props}
            className={cn(
                "relative text-sm text-tertiary outline-focus-ring focus-visible:z-1 focus-visible:outline-2 focus-visible:-outline-offset-2",
                size === "sm" && "px-5 py-3",
                size === "md" && "px-6 py-4",
                className
            )}
        >
            {children}
        </td>
    );
};

interface TableBodyProps extends ComponentProps<"tbody"> {
    emptyMessage?: ReactNode;
    isLoading?: boolean;
    skeletonRowCount?: number;
    colSpan?: number;
}

const TableBody = ({
    className,
    emptyMessage = "No results.",
    isLoading = false,
    skeletonRowCount = 5,
    colSpan = 1,
    children,
    ...props
}: TableBodyProps) => {
    const { table, size } = useTableContext();
    const rowCount = table.getRowModel().rows.length;

    if (isLoading) {
        return (
            <tbody className={className} {...props}>
                {Array.from({ length: skeletonRowCount }).map((_, i) => (
                    <tr
                        key={`skeleton-${i}`}
                        className={cn(
                            "border-b border-secondary last:border-b-0",
                            size === "sm" ? "h-14" : "h-18"
                        )}
                    >
                        {Array.from({ length: colSpan }).map((_, j) => (
                            <td
                                key={`skeleton-cell-${j}`}
                                className={cn(size === "sm" ? "px-5 py-3" : "px-6 py-4")}
                            >
                                <div
                                    className={cn(
                                        "h-4 rounded-md bg-secondary animate-pulse",
                                        j % 3 === 0 ? "w-3/4" : j % 3 === 1 ? "w-1/2" : "w-full"
                                    )}
                                />
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        );
    }

    if (rowCount === 0) {
        return (
            <tbody className={className} {...props}>
                <tr>
                    <td
                        colSpan={colSpan}
                        className={cn(
                            "text-center text-sm text-secondary",
                            size === "sm" ? "py-12" : "py-20"
                        )}
                    >
                        {emptyMessage}
                    </td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody className={className} {...props}>
            {children}
        </tbody>
    );
};

export { TableHeader, TableHead, TableRow, TableCell, TableBody };
