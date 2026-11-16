"use client";

import * as React from "react";
import {
    format,
    isSameDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subDays,
    subWeeks,
    subMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";

import { Calendar as CalendarIcon } from "@untitled-ui/icons-react";
import { Calendar } from "./calendar";
import { DateInput } from "./date-input";
import { useLocale } from "@/lib/hooks/use-locale";
import { RangePresetButton } from "./range-preset-button";
import { DateRange } from "react-day-picker";
import { FormFieldWrapper, type FormFieldWrapperProps } from "../form";
import { type FieldPath, type FieldValues } from "react-hook-form";
import { cn } from "@/lib/utils/cn";

interface DateRangePickerProps {
    value?: { start: Date; end: Date } | null;
    onChange?: (range: { start: Date; end: Date } | null) => void;
    size?: "sm" | "md" | "lg" | "xl";
    placeholder?: string;
    disabled?: boolean;
    "aria-invalid"?: boolean;
    triggerClassName?: string;
}

export function DateRangePicker({
    value,
    onChange,
    size = "sm",
    placeholder = "Select dates",
    disabled = false,
    triggerClassName,
    ...props
}: DateRangePickerProps) {
    const { dateFormat } = useLocale();
    const [open, setOpen] = React.useState(false);
    const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>(
        value ? { from: value.start, to: value.end } : undefined
    );

    const now = new Date();
    const highlightedDates = [now];

    // Preset definitions
    const presets = React.useMemo(() => {
        const today = new Date();
        const yesterday = subDays(today, 1);

        return {
            today: {
                label: "Aujourd'hui",
                value: { from: today, to: today },
            },
            yesterday: {
                label: "Hier",
                value: { from: yesterday, to: yesterday },
            },
            thisWeek: {
                label: "Cette semaine",
                value: { from: startOfWeek(today), to: endOfWeek(today) },
            },
            lastWeek: {
                label: "Semaine dernière",
                value: {
                    from: startOfWeek(subWeeks(today, 1)),
                    to: endOfWeek(subWeeks(today, 1)),
                },
            },
            thisMonth: {
                label: "Ce mois",
                value: { from: startOfMonth(today), to: endOfMonth(today) },
            },
            lastMonth: {
                label: "Mois dernier",
                value: {
                    from: startOfMonth(subMonths(today, 1)),
                    to: endOfMonth(subMonths(today, 1)),
                },
            },
            thisYear: {
                label: "Cette année",
                value: {
                    from: new Date(today.getFullYear(), 0, 1),
                    to: new Date(today.getFullYear(), 11, 31),
                },
            },
            lastYear: {
                label: "L'an dernier",
                value: {
                    from: new Date(today.getFullYear() - 1, 0, 1),
                    to: new Date(today.getFullYear() - 1, 11, 31),
                },
            },
            // allTime: {
            //     label: "All time",
            //     value: {
            //         from: new Date(2000, 0, 1),
            //         to: today,
            //     },
            // },
        };
    }, []);

    const handleRangeSelect = (range: DateRange | undefined) => {
        setSelectedRange(range);
    };

    const handlePresetClick = (preset: DateRange) => {
        setSelectedRange(preset);
    };

    const handleApply = () => {
        if (selectedRange?.from && selectedRange?.to) {
            onChange?.({ start: selectedRange.from, end: selectedRange.to });
        }
        setOpen(false);
    };

    const handleCancel = () => {
        setSelectedRange(value ? { from: value.start, to: value.end } : undefined);
        setOpen(false);
    };

    const isPresetSelected = (preset: DateRange) => {
        return (
            selectedRange?.from &&
            selectedRange?.to &&
            preset.from &&
            preset.to &&
            isSameDay(selectedRange.from, preset.from) &&
            isSameDay(selectedRange.to, preset.to)
        );
    };

    const formatDateRange = () => {
        if (!value?.start) return <span className="text-placeholder">{placeholder}</span>;
        if (!value.end) return format(value.start, dateFormat);
        return `${format(value.start, dateFormat)} – ${format(value.end, dateFormat)}`;
    };

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button
                    size={size}
                    variant="secondary"
                    disabled={disabled}
                    aria-label="Date range picker"
                    leftIcon={CalendarIcon}
                    className={cn(
                        "justify-start",
                        !value && "text-placeholder",
                        // open && "ring-4 shadow-none ring-gray-100 outline-none"
                    )}
                >
                    {formatDateRange()}
                </Button>
            }
            triggerClassName={cn({
                "ring-error_subtle focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none":
                    props["aria-invalid"],
                triggerClassName,
            })}
            content={
                <div className="flex">
                    {/* Presets sidebar */}
                    <div className="hidden w-[200px] flex-col gap-0.5 border-r border-solid border-secondary p-3 lg:flex">
                        {Object.values(presets).map(preset => (
                            <RangePresetButton
                                key={preset.label}
                                isSelected={isPresetSelected(preset.value)}
                                onClick={() => handlePresetClick(preset.value)}
                            >
                                {preset.label}
                            </RangePresetButton>
                        ))}
                    </div>

                    <div className="flex flex-col">
                        <div className="px-6 py-5">
                            <Calendar
                                mode="range"
                                selected={selectedRange}
                                onSelect={handleRangeSelect}
                                highlightedDates={highlightedDates}
                                numberOfMonths={2}
                                className="items-start"
                            />
                        </div>

                        <div className="flex justify-between gap-3 border-t border-secondary p-4">
                            <div className="hidden items-center gap-3 md:flex">
                                <DateInput
                                    value={selectedRange?.from}
                                    onChange={date =>
                                        setSelectedRange(prev => ({
                                            ...prev,
                                            from: date || undefined,
                                        }))
                                    }
                                    size="sm"
                                    data-slot="start"
                                />
                                <div className="text-md text-quaternary">–</div>
                                <DateInput
                                    value={selectedRange?.to}
                                    onChange={date =>
                                        setSelectedRange(prev => ({
                                            ...prev,
                                            to: date || prev?.to || new Date(),
                                            from: prev?.from || new Date(),
                                        }))
                                    }
                                    size="sm"
                                    data-slot="end"
                                />
                            </div>

                            <div className="grid w-full grid-cols-2 gap-3 md:flex md:w-auto">
                                <Button size="sm" variant="secondary" onClick={handleCancel}>
                                    {"Annuler"}
                                </Button>
                                <Button size="sm" variant="primary" onClick={handleApply}>
                                    {"Appliquer"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            }
            contentClassName="w-auto p-0 rounded-2xl bg-primary shadow-xl ring ring-secondary_alt focus:outline-hidden"
        />
    );
}

// === FORM INTEGRATION ===
export interface InputFormProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormFieldWrapperProps<TFieldValues, TName>, "children">,
        Omit<DateRangePickerProps, "defaultValue" | "name"> {
    isRequired?: boolean;
}

export function DateRangePickerForm<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>({
    isRequired,
    control,
    name,
    label,
    description,
    labelTooltip,
    ...props
}: InputFormProps<TFieldValues, TName>) {
    return (
        <FormFieldWrapper
            control={control}
            name={name}
            label={label}
            labelTooltip={labelTooltip}
            description={description}
            isRequired={isRequired}
        >
            {field => {
                return <DateRangePicker {...field} {...props} />;
            }}
        </FormFieldWrapper>
    );
}
