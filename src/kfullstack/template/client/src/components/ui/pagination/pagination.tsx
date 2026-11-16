"use client";

import {
    ArrowLeft,
    ArrowRight,
    ChevronLeft,
    ChevronLeftDouble,
    ChevronRight,
    ChevronRightDouble,
} from "@untitled-ui/icons-react";
import * as React from "react";
import type { PaginationRootProps } from "./pagination-base";
import { PaginationBase } from "./pagination-base";
import { cn } from "@/lib/utils/cn";
import { Button, ButtonToggleGroupCustom } from "../button";
import { Select } from "../select";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginationProps extends Partial<Omit<PaginationRootProps, "children">> {
    rounded?: boolean;
    align?: "left" | "center" | "right";
    variant?: "default" | "minimal" | "card" | "card-minimal" | "button-group" | "card-advanced";
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export const Pagination = ({
    variant = "default",
    align,
    rounded = false,
    className,
    pageSize,
    pageSizeOptions,
    onPageSizeChange,
    page,
    total,
    onPageChange,
    ...paginationBaseProps
}: PaginationProps) => {
    if (variant === "default")
        return (
            <PaginationPageDefault
                className={className}
                rounded={rounded}
                page={page}
                total={total}
                onPageChange={onPageChange}
                {...paginationBaseProps}
            />
        );
    if (variant === "minimal")
        return (
            <PaginationPageMinimal
                className={className}
                page={page}
                total={total}
                onPageChange={onPageChange}
                {...paginationBaseProps}
            />
        );
    if (variant === "card")
        return (
            <PaginationCardDefault
                className={className}
                rounded={rounded}
                page={page}
                total={total}
                onPageChange={onPageChange}
                {...paginationBaseProps}
            />
        );
    if (variant === "card-minimal")
        return (
            <PaginationCardMinimal
                className={className}
                align={align}
                page={page}
                total={total}
                onPageChange={onPageChange}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageSizeChange={onPageSizeChange}
            />
        );
    if (variant === "card-advanced")
        return (
            <PaginationCardAdvanced
                className={className}
                align={align === "center" ? "center" : "space-between"}
                page={page}
                total={total}
                onPageChange={onPageChange}
                pageSize={pageSize}
                pageSizeOptions={pageSizeOptions}
                onPageSizeChange={onPageSizeChange}
            />
        );
    if (variant === "button-group")
        return (
            <PaginationButtonGroup
                className={className}
                align={align}
                page={page}
                total={total}
                onPageChange={onPageChange}
                {...paginationBaseProps}
            />
        );
};

// ─── PaginationPageDefault ────────────────────────────────────────────────────

function PaginationPageDefault({
    rounded,
    page = 1,
    total = 10,
    className,
    ...props
}: PaginationProps) {
    return (
        <PaginationBase.Root
            {...props}
            page={page}
            total={total}
            className={cn(
                "flex w-full items-center justify-between gap-3 border-t border-secondary pt-4 md:pt-5",
                className
            )}
        >
            <div className="hidden flex-1 justify-start md:flex">
                <PaginationBase.PrevTrigger asChild>
                    <Button
                        leftIcon={ArrowLeft}
                        variant="link-gray"
                        size="sm"
                        aria-label="Previous page"
                    >
                        <span className="hidden md:inline">Previous</span>
                    </Button>
                </PaginationBase.PrevTrigger>
            </div>

            <PaginationBase.PrevTrigger asChild className="md:hidden">
                <Button
                    leftIcon={ArrowLeft}
                    variant="secondary"
                    size="sm"
                    aria-label="Previous page"
                />
            </PaginationBase.PrevTrigger>

            <PaginationBase.Context>
                {({ pages, currentPage, total }) => (
                    <>
                        <div className="hidden justify-center gap-0.5 md:flex">
                            {pages.map((page, index) =>
                                page.type === "page" ? (
                                    <PaginationItem key={index} rounded={rounded} {...page} />
                                ) : (
                                    <PaginationBase.Ellipsis
                                        key={index}
                                        className="flex size-10 shrink-0 items-center justify-center text-tertiary"
                                    >
                                        &#8230;
                                    </PaginationBase.Ellipsis>
                                )
                            )}
                        </div>

                        <div className="flex justify-center text-sm whitespace-pre text-fg-secondary md:hidden">
                            Page <span className="font-medium">{currentPage}</span> of{" "}
                            <span className="font-medium">{total}</span>
                        </div>
                    </>
                )}
            </PaginationBase.Context>

            <div className="hidden flex-1 justify-end md:flex">
                <PaginationBase.NextTrigger asChild>
                    <Button
                        rightIcon={ArrowRight}
                        variant="link-gray"
                        size="sm"
                        aria-label="Next page"
                    >
                        <span className="hidden md:inline">Next</span>
                    </Button>
                </PaginationBase.NextTrigger>
            </div>

            <PaginationBase.NextTrigger asChild className="md:hidden">
                <Button
                    rightIcon={ArrowRight}
                    variant="secondary"
                    size="sm"
                    aria-label="Next page"
                />
            </PaginationBase.NextTrigger>
        </PaginationBase.Root>
    );
}

// ─── PaginationPageMinimal ────────────────────────────────────────────────────

function PaginationPageMinimal({ page = 1, total = 10, className, ...props }: PaginationProps) {
    return (
        <PaginationBase.Root
            {...props}
            page={page}
            total={total}
            className={cn(
                "flex w-full items-center justify-between gap-3 border-t border-secondary pt-4 md:pt-5",
                className
            )}
        >
            <div className="hidden flex-1 justify-start md:flex">
                <PaginationBase.PrevTrigger asChild>
                    <Button
                        leftIcon={ArrowLeft}
                        variant="link-gray"
                        size="sm"
                        aria-label="Previous page"
                    >
                        <span className="hidden md:inline">Previous</span>
                    </Button>
                </PaginationBase.PrevTrigger>
            </div>

            <PaginationBase.PrevTrigger asChild className="md:hidden">
                <Button
                    leftIcon={ArrowLeft}
                    variant="secondary"
                    size="sm"
                    aria-label="Previous page"
                />
            </PaginationBase.PrevTrigger>

            <span className="text-sm font-medium text-fg-secondary">
                Page {page} of {total}
            </span>

            <div className="hidden flex-1 justify-end md:flex">
                <PaginationBase.NextTrigger asChild>
                    <Button
                        rightIcon={ArrowRight}
                        variant="link-gray"
                        size="sm"
                        aria-label="Next page"
                    >
                        <span className="hidden md:inline">Next</span>
                    </Button>
                </PaginationBase.NextTrigger>
            </div>

            <PaginationBase.NextTrigger asChild className="md:hidden">
                <Button
                    rightIcon={ArrowRight}
                    variant="secondary"
                    size="sm"
                    aria-label="Next page"
                />
            </PaginationBase.NextTrigger>
        </PaginationBase.Root>
    );
}

// ─── PaginationCardDefault ────────────────────────────────────────────────────

function PaginationCardDefault({ rounded, page = 1, total = 10, ...props }: PaginationProps) {
    return (
        <PaginationBase.Root
            {...props}
            page={page}
            total={total}
            className="flex w-full items-center justify-between gap-3 border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4"
        >
            <div className="flex flex-1 justify-start">
                <PaginationBase.PrevTrigger asChild>
                    <Button
                        leftIcon={ArrowLeft}
                        variant="secondary"
                        size="sm"
                        aria-label="Previous page"
                    >
                        <span className="hidden md:inline">Previous</span>
                    </Button>
                </PaginationBase.PrevTrigger>
            </div>

            <PaginationBase.Context>
                {({ pages, currentPage, total }) => (
                    <>
                        <div className="hidden justify-center gap-0.5 md:flex">
                            {pages.map((page, index) =>
                                page.type === "page" ? (
                                    <PaginationItem key={index} rounded={rounded} {...page} />
                                ) : (
                                    <PaginationBase.Ellipsis
                                        key={index}
                                        className="flex size-10 shrink-0 items-center justify-center text-tertiary"
                                    >
                                        &#8230;
                                    </PaginationBase.Ellipsis>
                                )
                            )}
                        </div>

                        <div className="flex justify-center text-sm whitespace-pre text-fg-secondary md:hidden">
                            Page <span className="font-medium">{currentPage}</span> of{" "}
                            <span className="font-medium">{total}</span>
                        </div>
                    </>
                )}
            </PaginationBase.Context>

            <div className="flex flex-1 justify-end">
                <PaginationBase.NextTrigger asChild>
                    <Button
                        rightIcon={ArrowRight}
                        variant="secondary"
                        size="sm"
                        aria-label="Next page"
                    >
                        <span className="hidden md:inline">Next</span>
                    </Button>
                </PaginationBase.NextTrigger>
            </div>
        </PaginationBase.Root>
    );
}

// ─── PaginationCardMinimal ────────────────────────────────────────────────────

interface PaginationCardMinimalProps {
    page?: number;
    total?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
    align?: "left" | "center" | "right";
    className?: string;
    onPageChange?: (page: number) => void;
}

function PaginationCardMinimal({
    page = 1,
    total = 10,
    pageSize,
    pageSizeOptions,
    onPageSizeChange,
    align = "left",
    onPageChange,
    className,
}: PaginationCardMinimalProps) {
    const safePrev = Math.max(1, page - 1);
    const safeNext = Math.min(total, page + 1);
    const sizeOptions = pageSizeOptions ?? [10, 25, 50, 100];

    return (
        <div
            className={cn("border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4", className)}
        >
            <MobilePagination page={page} total={total} onPageChange={onPageChange} />

            <nav
                aria-label="Pagination"
                className={cn(
                    "hidden items-center gap-3 md:flex",
                    align === "center" && "justify-between"
                )}
            >
                <div className={cn(align === "center" && "flex flex-1 justify-start")}>
                    <Button
                        isDisabled={page <= 1}
                        variant="secondary"
                        size="sm"
                        aria-label="Previous page"
                        onClick={() => onPageChange?.(safePrev)}
                    >
                        Previous
                    </Button>
                </div>

                <div
                    className={cn(
                        "flex items-center gap-3",
                        align === "right" && "order-first mr-auto",
                        align === "left" && "order-last ml-auto flex-row-reverse"
                    )}
                >
                    <span className="text-sm font-medium text-fg-secondary">
                        Page {page} of {total}
                    </span>
                    {onPageSizeChange && (
                        <Select
                            aria-label="Rows per page"
                            value={pageSize != null ? String(pageSize) : String(sizeOptions[0])}
                            onValueChange={val => onPageSizeChange(Number(val))}
                            size="sm"
                            items={sizeOptions.map(n => ({
                                id: String(n),
                                label: `${n} per page`,
                            }))}
                        />
                    )}
                </div>

                <div className={cn(align === "center" && "flex flex-1 justify-end")}>
                    <Button
                        isDisabled={page >= total}
                        variant="secondary"
                        size="sm"
                        aria-label="Next page"
                        onClick={() => onPageChange?.(safeNext)}
                    >
                        Next
                    </Button>
                </div>
            </nav>
        </div>
    );
}

// ─── PaginationButtonGroup ────────────────────────────────────────────────────

interface PaginationButtonGroupProps extends Partial<Omit<PaginationRootProps, "children">> {
    align?: "left" | "center" | "right";
}

function PaginationButtonGroup({
    align = "left",
    page = 1,
    total = 10,
    ...props
}: PaginationButtonGroupProps) {
    return (
        <div
            className={cn(
                "flex border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4",
                align === "left" && "justify-start",
                align === "center" && "justify-center",
                align === "right" && "justify-end"
            )}
        >
            <PaginationBase.Root {...props} page={page} total={total}>
                <PaginationBase.Context>
                    {({ pages }) => (
                        <ButtonToggleGroupCustom.Root type="single" value={`${page}`} size="md">
                            <PaginationBase.PrevTrigger asChild>
                                <ButtonToggleGroupCustom.Item
                                    value="previous"
                                    leftIcon={ArrowLeft}
                                    aria-label="Previous page"
                                    label={<span className="hidden md:inline">Previous</span>}
                                />
                            </PaginationBase.PrevTrigger>

                            {pages.map((page, index) =>
                                page.type === "page" ? (
                                    <PaginationBase.Item key={index} {...page} asChild>
                                        <ButtonToggleGroupCustom.Item
                                            value={`${page.value}`}
                                            label={page.value}
                                            className="size-10 items-center justify-center"
                                        />
                                    </PaginationBase.Item>
                                ) : (
                                    <PaginationBase.Ellipsis key={index}>
                                        <ButtonToggleGroupCustom.Item
                                            value=""
                                            label="&#8230;"
                                            className="pointer-events-none size-10 items-center justify-center rounded-none!"
                                        />
                                    </PaginationBase.Ellipsis>
                                )
                            )}

                            <PaginationBase.NextTrigger asChild>
                                <ButtonToggleGroupCustom.Item
                                    value="next"
                                    rightIcon={ArrowRight}
                                    aria-label="Next page"
                                    label={<span className="hidden md:inline">Next</span>}
                                />
                            </PaginationBase.NextTrigger>
                        </ButtonToggleGroupCustom.Root>
                    )}
                </PaginationBase.Context>
            </PaginationBase.Root>
        </div>
    );
}

// ─── PaginationCardAdvanced ───────────────────────────────────────────────────

interface PaginationCardAdvancedProps {
    page?: number;
    total?: number;
    pageSize?: number;
    pageSizeOptions?: number[];
    align?: "space-between" | "center";
    className?: string;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

function PaginationCardAdvanced({
    page = 1,
    total = 10,
    pageSize,
    pageSizeOptions,
    align = "space-between",
    onPageChange,
    onPageSizeChange,
    className,
}: PaginationCardAdvancedProps) {
    const [inputValue, setInputValue] = React.useState(String(page));
    const sizeOptions = pageSizeOptions ?? [10, 25, 50, 100];

    React.useEffect(() => {
        setInputValue(String(page));
    }, [page]);

    const commitPage = (value: string) => {
        const v = Number(value);
        if (Number.isInteger(v) && v >= 1 && v <= total) {
            onPageChange?.(v);
        } else {
            setInputValue(String(page));
        }
    };

    return (
        <div
            className={cn("border-t border-secondary px-4 py-3 md:px-6 md:pt-3 md:pb-4", className)}
        >
            <PaginationBase.Root
                page={page}
                total={total}
                onPageChange={onPageChange}
                className={cn(
                    "flex items-center gap-3",
                    align === "center" && "justify-between"
                )}
            >
                {/* Page input — desktop only */}
                <div className="hidden items-center gap-2 text-sm font-medium whitespace-nowrap text-fg-secondary md:flex">
                    Page
                    <input
                        aria-label="Go to page"
                        type="number"
                        min={1}
                        max={total}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onBlur={e => commitPage(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && commitPage(inputValue)}
                        className="h-9 w-12 rounded-md border border-secondary bg-primary px-2 text-center text-sm text-primary outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
                    />
                    of {total}
                </div>

                <hr
                    className={cn(
                        "mx-1 h-4 w-px border-0 border-l border-primary max-md:hidden",
                        align === "center" && "hidden"
                    )}
                />

                {/* Rows per page — desktop only */}
                {onPageSizeChange && (
                    <div
                        className={cn(
                            "hidden items-center gap-2 md:flex",
                            align === "center" && "order-last"
                        )}
                    >
                        <span className="text-sm font-medium whitespace-nowrap text-fg-secondary">
                            Rows per page
                        </span>
                        <Select
                            aria-label="Rows per page"
                            value={pageSize != null ? String(pageSize) : String(sizeOptions[0])}
                            onValueChange={val => onPageSizeChange(Number(val))}
                            size="sm"
                            items={sizeOptions.map(n => ({
                                id: String(n),
                                label: String(n),
                            }))}
                        />
                    </div>
                )}

                {/* Navigation */}
                <div
                    className={cn(
                        "flex flex-1 items-center gap-4 md:ml-auto md:justify-end",
                        align === "center" && "md:justify-center"
                    )}
                >
                    <div className="flex gap-2">
                        <Button
                            leftIcon={ChevronLeftDouble}
                            variant="secondary"
                            size="sm"
                            isDisabled={page <= 1}
                            onClick={() => onPageChange?.(1)}
                            aria-label="First page"
                        />
                        <PaginationBase.PrevTrigger asChild>
                            <Button
                                leftIcon={ChevronLeft}
                                variant="secondary"
                                size="sm"
                                aria-label="Previous page"
                            />
                        </PaginationBase.PrevTrigger>
                    </div>

                    <PaginationBase.Context>
                        {({ pages, currentPage, total }) => (
                            <>
                                <div className="hidden justify-center gap-0.5 md:flex">
                                    {pages.map((page, index) =>
                                        page.type === "page" ? (
                                            <PaginationItem key={index} {...page} />
                                        ) : (
                                            <PaginationBase.Ellipsis
                                                key={index}
                                                className="flex size-10 shrink-0 items-center justify-center text-tertiary"
                                            >
                                                &#8230;
                                            </PaginationBase.Ellipsis>
                                        )
                                    )}
                                </div>

                                <div className="flex flex-1 justify-center text-sm whitespace-pre text-fg-secondary md:hidden">
                                    Page <span className="font-medium">{currentPage}</span> of{" "}
                                    <span className="font-medium">{total}</span>
                                </div>
                            </>
                        )}
                    </PaginationBase.Context>

                    <div className="flex gap-2">
                        <PaginationBase.NextTrigger asChild>
                            <Button
                                rightIcon={ChevronRight}
                                variant="secondary"
                                size="sm"
                                aria-label="Next page"
                            />
                        </PaginationBase.NextTrigger>
                        <Button
                            rightIcon={ChevronRightDouble}
                            variant="secondary"
                            size="sm"
                            isDisabled={page >= total}
                            onClick={() => onPageChange?.(total)}
                            aria-label="Last page"
                        />
                    </div>
                </div>
            </PaginationBase.Root>
        </div>
    );
}

// ─── PaginationItem ───────────────────────────────────────────────────────────

const PaginationItem = ({
    value,
    rounded,
    isCurrent,
}: {
    value: number;
    rounded?: boolean;
    isCurrent: boolean;
}) => (
    <PaginationBase.Item
        value={value}
        isCurrent={isCurrent}
        className={({ isSelected }) =>
            cn(
                "flex size-10 cursor-pointer items-center justify-center p-3 text-sm font-medium text-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-secondary focus-visible:z-10 focus-visible:bg-primary_hover focus-visible:outline-2 focus-visible:outline-offset-2",
                rounded ? "rounded-full" : "rounded-lg",
                isSelected && "bg-primary_hover text-secondary"
            )
        }
    >
        {value}
    </PaginationBase.Item>
);

// ─── MobilePagination ─────────────────────────────────────────────────────────

const MobilePagination = ({
    page = 1,
    total = 10,
    className,
    onPageChange,
}: {
    page?: number;
    total?: number;
    className?: string;
    onPageChange?: (page: number) => void;
}) => (
    <nav
        aria-label="Pagination"
        className={cn("flex items-center justify-between md:hidden", className)}
    >
        <Button
            aria-label="Previous page"
            leftIcon={ArrowLeft}
            variant="secondary"
            size="sm"
            onClick={() => onPageChange?.(Math.max(1, page - 1))}
            isDisabled={page <= 1}
        />

        <span className="text-sm text-fg-secondary">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">{total}</span>
        </span>

        <Button
            aria-label="Next page"
            rightIcon={ArrowRight}
            variant="secondary"
            size="sm"
            onClick={() => onPageChange?.(Math.min(total, page + 1))}
            isDisabled={page >= total}
        />
    </nav>
);
