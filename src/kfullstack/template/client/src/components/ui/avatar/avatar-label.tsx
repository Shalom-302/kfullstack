"use client";

import { type ReactNode } from "react";
import { Avatar, type AvatarProps } from "./avatar";
import { cn } from "@/lib/utils/cn";

const styles = {
    sm: { title: "text-sm", subtitle: "text-xs" },
    md: { title: "text-sm", subtitle: "text-sm" },
    lg: { title: "text-md", subtitle: "text-md" },
};

interface AvatarLabelProps extends Omit<AvatarProps, "size"> {
    size: "sm" | "md" | "lg";
    title: string | ReactNode;
    subtitle: string | ReactNode;
    /**
     * Class name applied to the Avatar element.
     */
    avatarClassName?: string;
}

export const AvatarLabel = ({
    title,
    subtitle,
    size,
    className,
    avatarClassName,
    ...props
}: AvatarLabelProps) => {
    return (
        <figure className={cn("group flex min-w-0 flex-1 items-center gap-2", className)}>
            <Avatar size={size} className={avatarClassName} {...props} />
            <figcaption className="min-w-0 flex-1">
                <p className={cn("font-semibold text-primary truncate", styles[size].title)}>
                    {title}
                </p>
                <p className={cn("truncate text-tertiary", styles[size].subtitle)}>
                    {subtitle}
                </p>
            </figcaption>
        </figure>
    );
};