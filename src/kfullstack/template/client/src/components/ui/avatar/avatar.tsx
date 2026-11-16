"use client";

import { type ComponentProps, type FC, type ReactNode, useState, useEffect, useRef } from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import Image from "next/image";
import { AvatarOnlineIndicator, VerifiedTick } from "./base-components";
import { AvatarCount } from "./base-components/avatar-count";
import { cn } from "@/lib/utils/cn";
import { User01 } from "@untitled-ui/icons-react";

export interface AvatarProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
    className?: string;
    contentClassName?: string;
    src?: string | null;
    alt?: string;
    contrastBorder?: boolean;
    rounded?: boolean;
    border?: boolean;
    badge?: ReactNode;
    status?: "online" | "offline";
    verified?: boolean;
    count?: number;
    initials?: string;
    placeholderIcon?: FC<{ className?: string }>;
    placeholder?: ReactNode;
    /** shadcn-style composition: <Avatar><AvatarImage/><AvatarFallback/></Avatar> */
    children?: ReactNode;
    /**
     * When true, the avatar renders as a <button> with a native focus ring.
     * An accessible label is required — derived from `alt`, `initials`, or `aria-label`.
     * @default false
     */
    focusable?: boolean;
    onClick?: () => void;
    /**
     * Delay in ms before the fallback is shown while the image is loading.
     * Avoids a flash of the fallback on fast connections.
     * @default 300
     */
    fallbackDelayMs?: number;
}

const styles = {
    xs: {
        root: "size-6",
        rootWithBorder: "p-px",
        initials: "text-xs font-semibold",
        icon: "size-4",
        px: 24,
    },
    sm: {
        root: "size-8",
        rootWithBorder: "p-px",
        initials: "text-sm font-semibold",
        icon: "size-5",
        px: 32,
    },
    md: {
        root: "size-10",
        rootWithBorder: "p-px",
        initials: "text-md font-semibold",
        icon: "size-6",
        px: 40,
    },
    lg: {
        root: "size-12",
        rootWithBorder: "p-[1.5px]",
        initials: "text-lg font-semibold",
        icon: "size-7",
        px: 48,
    },
    xl: {
        root: "size-14",
        rootWithBorder: "p-0.5",
        initials: "text-xl font-semibold",
        icon: "size-8",
        px: 56,
    },
    "2xl": {
        root: "size-16",
        rootWithBorder: "p-0.5",
        initials: "text-display-xs font-semibold",
        icon: "size-8",
        px: 64,
    },
} as const;

export const Avatar = ({
    size = "md",
    src,
    alt,
    initials,
    placeholder,
    placeholderIcon: PlaceholderIcon,
    border,
    badge,
    status,
    verified,
    count,
    focusable = false,
    rounded = true,
    fallbackDelayMs = 300,
    onClick,
    className,
    contentClassName,
    children,
}: AvatarProps) => {
    const [isFailed, setIsFailed] = useState(false);
    const [showFallback, setShowFallback] = useState(!src);
    const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!src) {
            setShowFallback(true);
            setIsFailed(false);
            return;
        }

        setShowFallback(false);
        setIsFailed(false);

        fallbackTimerRef.current = setTimeout(() => {
            setShowFallback(true);
        }, fallbackDelayMs);

        return () => {
            if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        };
    }, [src, fallbackDelayMs]);

    const canShowImage = !!src && !isFailed;

    const handleImageLoad = () => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        setShowFallback(false);
    };

    const handleImageError = () => {
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
        setIsFailed(true);
        setShowFallback(true);
    };

    const renderFallback = () => {
        if (initials) {
            return <span className={cn("text-quaternary", styles[size].initials)}>{initials}</span>;
        }
        if (PlaceholderIcon) {
            return <PlaceholderIcon className={cn("text-fg-quaternary", styles[size].icon)} />;
        }
        return placeholder || <User01 className={cn("text-fg-quaternary", styles[size].icon)} />;
    };

    const renderMainContent = () => (
        <>
            {canShowImage && (
                /*
                 * `fill` évite de passer width/height explicites.
                 * Le parent doit être `position: relative` avec des dimensions
                 * définies — garanti par les classes `size-*` du wrapper.
                 * `sizes` informe Next.js de la taille réelle rendue
                 * pour générer le srcset optimal.
                 */
                <Image
                    fill
                    data-avatar-img
                    className="object-cover"
                    src={src}
                    alt={alt ?? ""}
                    sizes={`${styles[size].px}px`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                />
            )}
            <span
                aria-hidden={canShowImage}
                className={cn(
                    "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
                    showFallback && !canShowImage ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
            >
                {renderFallback()}
            </span>
        </>
    );

    const renderBadgeContent = () => {
        if (status) {
            return <AvatarOnlineIndicator status={status} size={size} />;
        }
        if (verified) {
            return (
                <VerifiedTick
                    size={size}
                    className={cn(
                        "absolute right-0 bottom-0",
                        size === "xs" && "-right-px -bottom-px"
                    )}
                />
            );
        }
        if (count) {
            return <AvatarCount count={count} />;
        }
        return badge;
    };

    const avatarNode = (
        <div
            data-avatar
            className={cn(
                "relative inline-flex shrink-0 rounded-[7px]",
                rounded && "rounded-full",
                border && "ring-1 ring-secondary_alt",
                border && styles[size].rootWithBorder,
                styles[size].root,
                className
            )}
        >
            <div
                className={cn(
                    "relative inline-flex size-full shrink-0 items-center justify-center overflow-hidden rounded-md bg-tertiary outline-[0.5px] -outline-offset-[0.5px] outline-black/16",
                    rounded && "rounded-full",
                    canShowImage &&
                        size !== "xs" &&
                        "before:absolute before:inset-0 before:rounded-[inherit] before:border before:border-white/32 before:mask-[linear-gradient(to_bottom,black_0%,transparent_25%,transparent_75%,black_100%)]",
                    contentClassName
                )}
            >
                {renderMainContent()}
            </div>
            {renderBadgeContent()}
        </div>
    );

    if (focusable) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "rounded-full cursor-pointer",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
                    "border-0 bg-transparent p-0"
                )}
                aria-label={alt ?? initials ?? undefined}
            >
                {avatarNode}
            </button>
        );
    }

    // shadcn/Radix composition mode — used by header.tsx, admin-layout.tsx
    // and conversation-header.tsx (<Avatar><AvatarImage/><AvatarFallback/>)
    if (children) {
        return (
            <AvatarPrimitive.Root
                className={cn(
                    "relative flex size-10 shrink-0 overflow-hidden rounded-full",
                    className
                )}
            >
                {children}
            </AvatarPrimitive.Root>
        );
    }

    return avatarNode;
};

// ── shadcn/Radix-compatible subcomponents ─────────────────────
export const AvatarImage = ({
    className,
    ...props
}: ComponentProps<typeof AvatarPrimitive.Image>) => (
    <AvatarPrimitive.Image className={cn("aspect-square size-full", className)} {...props} />
);

export const AvatarFallback = ({
    className,
    ...props
}: ComponentProps<typeof AvatarPrimitive.Fallback>) => (
    <AvatarPrimitive.Fallback
        className={cn(
            "bg-secondary flex size-full items-center justify-center rounded-full",
            className
        )}
        {...props}
    />
);
