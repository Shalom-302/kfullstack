"use client";

import type {
    AnchorHTMLAttributes,
    ButtonHTMLAttributes,
    DetailedHTMLProps,
    FC,
    ReactNode,
} from "react";
import React, { isValidElement } from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { isReactComponent } from "@/lib/utils/is-react-component";

const buttonVariants = cva(
    [
        "group relative inline-flex h-max cursor-pointer items-center justify-center whitespace-nowrap outline-brand transition duration-100 ease-linear before:absolute focus-visible:outline-2 focus-visible:outline-offset-2",
        // When button is used within `InputGroup`
        "in-data-input-wrapper:shadow-xs in-data-input-wrapper:focus:!z-50 in-data-input-wrapper:in-data-left:-mr-px in-data-input-wrapper:in-data-left:rounded-r-none in-data-input-wrapper:in-data-left:before:rounded-r-none in-data-input-wrapper:in-data-right:-ml-px in-data-input-wrapper:in-data-right:rounded-l-none in-data-input-wrapper:in-data-right:before:rounded-l-none",
        // Disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 in-data-input-wrapper:disabled:opacity-100",
        // Icon styles
        "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-5 [&_svg]:shrink-0 [&_svg]:transition-inherit-all",
    ],
    {
        variants: {
            variant: {
                primary: [
                    "bg-brand-solid text-white shadow-xs-skeuomorphic ring-1 ring-transparent ring-inset hover:bg-brand-solid_hover data-loading:bg-brand-solid_hover",
                    // Inner border gradient
                    // "before:absolute before:inset-px before:border before:border-white/12 before:mask-b-from-0%",
                    "[&_svg]:text-button-primary-icon hover:[&_svg]:text-button-primary-icon_hover",
                ],
                secondary: [
                    "bg-primary text-secondary shadow-xs-skeuomorphic ring-1 ring-primary ring-inset hover:bg-primary_hover hover:text-secondary_hover data-loading:bg-primary_hover",
                    "[&_svg]:text-fg-quaternary hover:[&_svg]:text-fg-quaternary_hover",
                ],
                tertiary: [
                    "text-tertiary hover:bg-primary_hover hover:text-tertiary_hover data-loading:bg-primary_hover",
                    "[&_svg]:text-fg-quaternary hover:[&_svg]:text-fg-quaternary_hover",
                ],
                "link-gray": [
                    "justify-normal rounded p-0! text-tertiary hover:text-tertiary_hover",
                    "[&_svg]:text-fg-quaternary hover:[&_svg]:text-fg-quaternary_hover",
                ],
                "link-color": [
                    "justify-normal rounded p-0! text-brand-secondary hover:text-brand-secondary_hover",
                    "[&_svg]:text-fg-brand-secondary_alt hover:[&_svg]:text-fg-brand-secondary_hover",
                ],
                "primary-destructive": [
                    "bg-error-solid text-white shadow-xs-skeuomorphic ring-1 ring-transparent outline-error ring-inset hover:bg-error-solid_hover data-loading:bg-error-solid_hover",
                    // Inner border gradient
                    // "before:absolute before:inset-px before:border before:border-white/12 before:mask-b-from-0%",
                    "[&_svg]:text-button-destructive-primary-icon hover:[&_svg]:text-button-destructive-primary-icon_hover",
                ],
                "secondary-destructive": [
                    "bg-primary text-error-primary shadow-xs-skeuomorphic ring-1 ring-error_subtle outline-error ring-inset hover:bg-error-primary hover:text-error-primary_hover data-loading:bg-error-primary",
                    "[&_svg]:text-fg-error-secondary hover:[&_svg]:text-fg-error-primary",
                ],
                "tertiary-destructive": [
                    "text-error-primary outline-error hover:bg-error-primary hover:text-error-primary_hover data-loading:bg-error-primary",
                    "[&_svg]:text-fg-error-secondary hover:[&_svg]:text-fg-error-primary",
                ],
                "link-destructive": [
                    "justify-normal rounded p-0! text-error-primary outline-error hover:text-error-primary_hover",
                    "[&_svg]:text-fg-error-secondary hover:[&_svg]:text-fg-error-primary",
                ],
            },
            size: {
                sm: "gap-1 rounded-lg px-3 py-2 text-sm font-semibold before:rounded-[7px] data-icon-only:p-2",
                md: "gap-1 rounded-lg px-3.5 py-2.5 text-sm font-semibold before:rounded-[7px] data-icon-only:p-2.5",
                lg: "gap-1.5 rounded-lg px-4 py-2.5 text-md font-semibold before:rounded-[7px] data-icon-only:p-3",
                xl: "gap-1.5 rounded-lg px-4.5 py-3 text-md font-semibold before:rounded-[7px] data-icon-only:p-3.5",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "sm",
        },
    }
);

// ============================================
// TYPES
// ============================================

type ButtonIconComponent = FC<{ className?: string; size?: number }>;
export interface CommonProps extends VariantProps<typeof buttonVariants> {
    isDisabled?: boolean;
    isLoading?: boolean;
    leftIcon?: ButtonIconComponent | ReactNode;
    rightIcon?: ButtonIconComponent | ReactNode;
    showTextWhileLoading?: boolean;
    asChild?: boolean;
}

export interface ButtonProps
    extends CommonProps,
        DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> {}

export interface ButtonAnchorProps
    extends CommonProps,
        DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement> {}

export type Props = ButtonProps | ButtonAnchorProps;

// ─── LoadingSpinner ───────────────────────────────────────────────────────────

function LoadingSpinner({ className }: { className?: string }) {
    return (
        <svg
            fill="none"
            viewBox="0 0 20 20"
            className={cn("size-5 shrink-0 animate-spin", className)}
            aria-hidden="true"
        >
            <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                className="opacity-30"
            />
            <circle
                cx="10"
                cy="10"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="12.5 50"
                strokeLinecap="round"
            />
        </svg>
    );
}

// ─── renderIcon ──────────────────────────────────────────────────────────────

function renderIcon(icon: ButtonIconComponent | ReactNode | undefined) {
    if (!icon) return null;
    if (isValidElement(icon)) return icon;
    if (isReactComponent(icon)) {
        const Icon = icon;
        return <Icon className="size-5" />;
    }
    return icon as ReactNode;
}

// ─── Button ──────────────────────────────────────────────────────────────────

export function Button({
    size,
    variant,
    children,
    className,
    leftIcon,
    rightIcon,
    isDisabled: disabled,
    isLoading: loading,
    showTextWhileLoading = true,
    asChild = false,
    onClick,
    ...otherProps
}: Props) {
    const isDisabledState = Boolean(disabled);
    const href = "href" in otherProps ? otherProps.href : undefined;
    const isLinkVariant =
        variant === "link-color" || variant === "link-gray" || variant === "link-destructive";
    const isIconOnly = (leftIcon || rightIcon) && !children;

    const Component: React.ElementType = asChild ? Slot : href ? "a" : "button";
    const variantClasses = buttonVariants({ size, variant });
    const classesWithoutHover = variantClasses
        .split(" ")
        .filter((token) => !token.includes("hover:"))
        .join(" ");

    const rootProps = {
        "data-icon-only": isIconOnly ? "true" : undefined,
        "data-loading": loading ? "true" : undefined,
        "data-disabled": isDisabledState ? "true" : "false",
        "aria-busy": loading || undefined,
        "aria-disabled": isDisabledState || undefined,
        className: cn(
            isDisabledState ? classesWithoutHover : variantClasses,
            !isDisabledState &&
                isLinkVariant &&
                "underline decoration-transparent underline-offset-2 hover:decoration-current",
            loading && "pointer-events-none",
            className
        ),
    };

    const domProps = (() => {
        if (asChild) {
            return {
                tabIndex: isDisabledState ? -1 : undefined,
            };
        }
        if (href) {
            return {
                href: isDisabledState ? undefined : href,
                tabIndex: isDisabledState ? -1 : undefined,
            };
        }
        return {
            type: (otherProps as ButtonHTMLAttributes<HTMLButtonElement>).type ?? "button",
            disabled: isDisabledState,
        };
    })();

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        if (isDisabledState) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        onClick?.(
            event as React.MouseEvent<HTMLButtonElement> & React.MouseEvent<HTMLAnchorElement>
        );
    };

    const iconClass = cn(
        "pointer-events-none shrink-0 transition-inherit-all [&>svg]:shrink-0 [&_svg]:transition-inherit-all"
    );

    const textContent = children && (
        <span
            data-slot="text"
            className={cn(
                "px-0.5 transition-inherit-all",
                !isDisabledState &&
                    isLinkVariant &&
                    "underline decoration-transparent underline-offset-2 hover:decoration-current",
                loading && !showTextWhileLoading && "invisible"
            )}
        >
            {children}
        </span>
    );

    return (
        <Component {...rootProps} {...domProps} {...otherProps} onClick={handleClick}>
            {/* Icône gauche */}
            {leftIcon && <span className={iconClass}>{renderIcon(leftIcon)}</span>}

            {/* Spinner */}
            {loading && (
                <LoadingSpinner
                    className={cn(
                        !showTextWhileLoading &&
                            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    )}
                />
            )}

            {/* Texte */}
            {asChild ? <Slottable>{children}</Slottable> : textContent}

            {/* Icône droite */}
            {rightIcon && <span className={iconClass}>{renderIcon(rightIcon)}</span>}
        </Component>
    );
}

export type ButtonVariants = VariantProps<typeof buttonVariants>;
export { buttonVariants };

// Type alias — link-button.tsx imports LinkProps from this module.
export type LinkProps = CommonProps & Omit<React.ComponentProps<"button">, "color" | "slot">;
