"use client";

import { isToday, isSameDay } from "date-fns";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";
import { ChevronDown, ChevronLeft, ChevronRight } from "@untitled-ui/icons-react";

import * as React from "react";

import { ButtonUtility, ButtonVariants } from "@/components/ui/button";

import { cn } from "@/lib/utils/cn";
import { getLocalizedLabels, useLocale } from "@/lib/hooks/use-locale";

export function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    captionLayout = "label",
    formatters,
    components,
    highlightedDates = [],
    headerExtra,
    ...props
}: React.ComponentProps<typeof DayPicker> & {
    buttonVariant?: ButtonVariants["variant"];
    highlightedDates?: Date[];
    headerExtra?: React.ReactNode;
}) {
    const { locale, localeCode, isRTL, firstDayOfWeek } = useLocale();
    const defaultClassNames = getDefaultClassNames();
    const localizedLabels = getLocalizedLabels(localeCode);

    return (
        <DayPicker
            locale={locale}
            weekStartsOn={firstDayOfWeek}
            dir={isRTL ? "rtl" : "ltr"}
            showOutsideDays={showOutsideDays}
            className={cn("flex flex-col gap-3", isRTL && "rtl", className)}
            captionLayout={captionLayout}
            labels={localizedLabels}
            formatters={{
                formatMonthDropdown: date => date.toLocaleString(localeCode, { month: "short" }),
                formatYearDropdown: date => date.toLocaleString(localeCode, { year: "numeric" }),
                formatWeekdayName: date =>
                    date.toLocaleDateString(localeCode, { weekday: "short" }),
                formatMonthCaption: date =>
                    date.toLocaleDateString(localeCode, {
                        month: "long",
                        year: "numeric",
                    }),
                ...formatters,
            }}
            classNames={{
                root: cn("w-fit", defaultClassNames.root),
                months: cn("flex gap-4 flex-col md:flex-row relative", defaultClassNames.months),
                month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
                nav: cn(
                    "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
                    isRTL && "flex-row-reverse",
                    defaultClassNames.nav
                ),
                button_previous: cn(
                    // buttonVariants({ variant: "secondary" }),
                    // "size-8 p-0 select-none hover:bg-primary_hover",
                    defaultClassNames.button_previous
                ),
                button_next: cn(
                    // buttonVariants({ variant: "secondary" }),
                    // "size-8 p-0 select-none hover:bg-primary_hover",
                    defaultClassNames.button_next
                ),
                month_caption: cn(
                    "flex items-center justify-center h-8 w-full px-8",
                    defaultClassNames.month_caption
                ),
                caption_label: cn(
                    "text-sm font-semibold text-fg-secondary",
                    defaultClassNames.caption_label
                ),
                table: "w-full border-collapse",
                weekdays: cn(
                    "flex border-b border-transparent!",
                    isRTL && "flex-row-reverse",
                    defaultClassNames.weekdays
                ),
                weekday: cn(
                    "flex size-10 items-center justify-center text-sm font-medium text-secondary",
                    defaultClassNames.weekday
                ),
                week: cn(
                    "flex w-full border-b border-transparent! last:border-none",
                    isRTL && "flex-row-reverse",
                    defaultClassNames.week
                ),
                // day: cn("relative size-10 p-0 focus-within:z-20", defaultClassNames.day),
                // range_start: cn(
                //     isRTL ? "rounded-r-full bg-active" : "rounded-l-full bg-active",
                //     defaultClassNames.range_start
                // ),
                // range_middle: cn("bg-active", defaultClassNames.range_middle),
                // range_end: cn(
                //     isRTL ? "rounded-l-full bg-active" : "rounded-r-full bg-active",
                //     defaultClassNames.range_end
                // ),
                // today: cn("bg-active font-medium rounded-full", defaultClassNames.today),
                day: cn(
                    "relative size-10 p-0 focus-within:z-20",
                    "[&:has([data-range-start])]:rounded-l-full [&:has([data-range-end])]:rounded-r-full",
                    "[&:has([data-week-start])]:rounded-l-full [&:has([data-week-end])]:rounded-r-full",
                    "[&:has([data-range-middle])]:bg-brand-primary",
                    defaultClassNames.day
                ),
                range_start: cn("bg-brand-primary rounded-l-full", defaultClassNames.range_start),
                range_middle: cn("bg-brand-primary", defaultClassNames.range_middle),
                range_end: cn("bg-brand-primary rounded-r-full", defaultClassNames.range_end),
                today: cn(defaultClassNames.today),
                outside: cn("text-tertiary opacity-50 hidden", defaultClassNames.outside),
                disabled: cn("text-disabled pointer-events-none", defaultClassNames.disabled),
                hidden: cn("invisible", defaultClassNames.hidden),
                ...classNames,
            }}
            components={{
                ...(headerExtra
                    ? {
                          Month: ({
                              children,
                              className: monthClassName,
                              ...monthProps
                          }: React.ComponentProps<"div">) => {
                              const childArray = React.Children.toArray(children);
                              return (
                                  <div className={monthClassName} {...monthProps}>
                                      {childArray[0]}
                                      {headerExtra}
                                      {childArray.slice(1)}
                                  </div>
                              );
                          },
                      }
                    : {}),
                Root: ({ className, rootRef, ...props }) => (
                    <div ref={rootRef} className={cn(className)} {...props} />
                ),
                Chevron: ({ className, orientation, ...props }) => {
                    // Inverser les chevrons pour RTL
                    const actualOrientation = isRTL
                        ? orientation === "left"
                            ? "right"
                            : orientation === "right"
                              ? "left"
                              : orientation
                        : orientation;

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { size, ...rest } = props;

                    if (actualOrientation === "left") {
                        return (
                            <ButtonUtility
                                variant={"tertiary"}
                                icon={ChevronLeft}
                                className={className}
                                {...rest}
                            />
                        );
                    }
                    if (actualOrientation === "right") {
                        return (
                            <ButtonUtility
                                variant={"tertiary"}
                                icon={ChevronRight}
                                className={className}
                                {...rest}
                            />
                        );
                    }
                    return (
                        <ButtonUtility
                            variant={"tertiary"}
                            icon={ChevronDown}
                            className={className}
                            {...rest}
                        />
                    );
                },
                DayButton: props => (
                    <CalendarDayButton
                        {...props}
                        highlightedDates={highlightedDates}
                        firstDayOfWeek={firstDayOfWeek}
                    />
                ),
                ...components,
            }}
            {...props}
        />
    );
}

function CalendarDayButton({
    className,
    day,
    modifiers,
    highlightedDates = [],
    firstDayOfWeek = 1,
    ...props
}: React.ComponentProps<typeof DayButton> & {
    highlightedDates?: Date[];
    firstDayOfWeek?: 0 | 1 | 6;
}) {
    const defaultClassNames = getDefaultClassNames();
    const isHighlighted = highlightedDates.some(d => isSameDay(d, day.date));
    const isTodayDate = isToday(day.date);

    const ref = React.useRef<HTMLButtonElement>(null);
    React.useEffect(() => {
        if (modifiers.focused) ref.current?.focus();
    }, [modifiers.focused]);

    const dayOfWeek = day.date.getDay(); // 0=Sun, 1=Mon, ...
    const isWeekStart = dayOfWeek === firstDayOfWeek;
    const isWeekEnd = dayOfWeek === (firstDayOfWeek + 6) % 7;

    const markedAsSelected =
        modifiers.range_start ||
        modifiers.range_end ||
        (modifiers.selected && !modifiers.disabled && !modifiers.range_middle);

    return (
        <button
            ref={ref}
            type="button"
            data-range-start={modifiers.range_start || undefined}
            data-range-end={modifiers.range_end || undefined}
            data-range-middle={modifiers.range_middle || undefined}
            data-week-start={(modifiers.selected && isWeekStart) || undefined}
            data-week-end={(modifiers.selected && isWeekEnd) || undefined}
            disabled={modifiers.disabled}
            className={cn(
                "relative flex size-full items-center justify-center rounded-full text-sm text-secondary hover:text-secondary_hover",
                "focus:outline-hidden cursor-pointer",
                // Disabled
                modifiers.disabled && "text-secondary/50 pointer-events-none",
                // Focus ring
                modifiers.focused && "outline-2 outline-offset-2 outline-focus-ring z-10",
                // Range middle
                modifiers.range_middle && !modifiers.disabled && "font-medium rounded-none",
                // Range start / end rounding
                modifiers.range_start && "rounded-l-full",
                modifiers.range_end && "rounded-r-full",
                // Selected / range start / range end
                markedAsSelected &&
                    "bg-brand-solid font-medium text-white hover:bg-brand-solid_hover hover:text-white",
                // Hover for non-selected, non-disabled
                !modifiers.selected &&
                    !modifiers.disabled &&
                    "hover:bg-primary_hover hover:font-medium!",
                // Today (when not selected)
                !modifiers.selected &&
                    isTodayDate &&
                    "bg-active font-medium hover:bg-secondary_hover",
                // Today inside range: no rounding
                modifiers.selected && isTodayDate && modifiers.range_middle && "rounded-none",
                // Outside month
                modifiers.outside && "text-tertiary opacity-50",
                defaultClassNames.day,
                className
            )}
            {...props}
        >
            {day.date.getDate()}
            {(isHighlighted || isTodayDate) && (
                <div
                    className={cn(
                        "absolute bottom-1 left-1/2 size-1.25 -translate-x-1/2 rounded-full",
                        markedAsSelected ? "bg-fg-white" : "bg-fg-brand-primary",
                        modifiers.disabled && "opacity-50"
                    )}
                />
            )}
        </button>
    );
}
