"use client";

import * as React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Popover } from "@/components/ui/popover";

import { Calendar as CalendarIcon } from "@untitled-ui/icons-react";
import { Calendar } from "./calendar";
import { DateInput } from "./date-input";
import { useLocale } from "@/lib/hooks/use-locale";
import { FormFieldWrapper, type FormFieldWrapperProps } from "../form";
import { type FieldPath, type FieldValues } from "react-hook-form";

interface DatePickerProps {
    value?: Date | undefined;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    size?: "sm" | "md" | "lg" | "xl";
    disabled?: boolean;
    "aria-invalid"?: boolean;
    triggerClassName?: string;
}

export function DatePicker({
    value,
    onChange,
    placeholder = "Select date",
    size = "sm",
    disabled = false,
    triggerClassName,
    ...props
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value || undefined);

    React.useEffect(() => {
        setSelectedDate(value);
    }, [value]);

    const highlightedDates = [new Date()]; // Today

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date);
    };

    const handleApply = () => {
        onChange?.(selectedDate || undefined);
        setOpen(false);
    };

    const handleCancel = () => {
        setSelectedDate(value || undefined);
        setOpen(false);
    };

    const todayPreset = () => {
        const today = new Date();
        setSelectedDate(today);
    };
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
            handleApply();
        }
    };

    const { dateFormat } = useLocale();

    const formattedDate = value ? format(value, dateFormat) : placeholder;

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
            trigger={
                <Button
                    size={size}
                    variant="secondary"
                    className={cn(
                        "justify-start",
                        !value && "text-placeholder"
                        // open && "ring-4 shadow-none ring-gray-100 outline-none"
                    )}
                    disabled={disabled}
                    leftIcon={CalendarIcon}
                    aria-label="Date picker"
                >
                    {formattedDate}
                </Button>
            }
            triggerClassName={cn({
                "ring-error_subtle focus-visible:ring-2 focus-visible:ring-error focus-visible:outline-none":
                    props["aria-invalid"],
                triggerClassName,
            })}
            content={
                <div className="w-full" onKeyDown={handleKeyDown}>
                    <div className="flex px-6 py-5 ">
                        <div className="flex flex-col gap-3">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateSelect}
                                highlightedDates={highlightedDates}
                                className="w-max"
                                headerExtra={
                                    <div className="flex gap-3">
                                        <DateInput
                                            value={selectedDate}
                                            onChange={setSelectedDate}
                                            className="flex-1 rounded-full"
                                            size="md"
                                        />
                                        <Button size="md" variant="secondary" onClick={todayPreset}>
                                            {"Aujourd'hui"}
                                        </Button>
                                    </div>
                                }
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-secondary p-4">
                        <Button size="sm" variant="secondary" onClick={handleCancel}>
                            {"Annuler"}
                        </Button>
                        <Button size="sm" variant="primary" onClick={handleApply}>
                            {"Appliquer"}
                        </Button>
                    </div>
                </div>
            }
            contentClassName="w-auto p-0 rounded-2xl bg-primary ring ring-secondary_alt"
        />
    );
}

// === FORM INTEGRATION ===
export interface InputFormProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<FormFieldWrapperProps<TFieldValues, TName>, "children">,
        Omit<DatePickerProps, "defaultValue" | "name"> {
    isRequired?: boolean;
}

export function DatePickerForm<
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
                return <DatePicker {...field} {...props} />;
            }}
        </FormFieldWrapper>
    );
}
