"use client";

import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { Button, ButtonGroup, ButtonUtility } from "../button";
import { Calendar as MiniCalendar } from "@/components/ui/date-picker/calendar";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Copy01,
    Trash01,
    Edit01,
    Map01,
    Clock,
    Calendar,
    BellRinging01,
} from "@untitled-ui/icons-react";
import { Select } from "../select";
import { Badge } from "../badge";
import { AvatarAddButton, AvatarGroup } from "../avatar";

type EventColor =
    | "gray"
    | "brand"
    | "blue"
    | "pink"
    | "orange"
    | "green"
    | "yellow"
    | "indigo"
    | "purple";

interface CalendarEvent {
    id: string;
    title: string;
    time: string;
    endTime?: string;
    color: EventColor;
    hasDot?: boolean;
    description?: string;
    guests?: number;
    location?: string;
    startDate: Date;
    reminder?: string;
}

interface CalendarDay {
    date: number;
    month: number;
    year: number;
    events: CalendarEvent[];
    isToday?: boolean;
    isSelected?: boolean;
    isDisabled?: boolean;
}

type ViewMode = "month" | "week" | "day";

interface PackedEvent extends CalendarEvent {
    top: number;
    height: number;
    left: number;
    width: number;
    column: number;
    columns: number;
    start: number;
    end: number;
}

// --- Styles des événements ---

const eventColorStyles: Record<
    EventColor,
    { bg: string; bg_hover: string; border: string; text: string; time: string; dot: string }
> = {
    gray: {
        bg: "bg-utility-gray-50",
        bg_hover: "hover:bg-utility-gray-100",
        border: "border-utility-gray-200",
        text: "text-utility-gray-700",
        time: "text-utility-gray-600",
        dot: "bg-utility-gray-500",
    },
    brand: {
        bg: "bg-utility-brand-50",
        bg_hover: "hover:bg-utility-brand-100",
        border: "border-utility-brand-200",
        text: "text-utility-brand-700",
        time: "text-utility-brand-600",
        dot: "bg-utility-brand-500",
    },
    blue: {
        bg: "bg-utility-blue-50",
        bg_hover: "hover:bg-utility-blue-100",
        border: "border-utility-blue-200",
        text: "text-utility-blue-700",
        time: "text-utility-blue-600",
        dot: "bg-utility-blue-500",
    },
    pink: {
        bg: "bg-[#FDF2FA]",
        bg_hover: "hover:bg-[#FCE7F6]",
        border: "border-[#FCCEEE]",
        text: "text-[#C11574]",
        time: "text-[#DD2590]",
        dot: "bg-[#DD2590]",
    },
    orange: {
        bg: "bg-[#FEF6EE]",
        bg_hover: "hover:bg-[#FDEAD7]",
        border: "border-[#F9DBAF]",
        text: "text-[#B93815]",
        time: "text-[#E04F16]",
        dot: "bg-[#E04F16]",
    },
    green: {
        bg: "bg-utility-success-50",
        bg_hover: "hover:bg-utility-success-100",
        border: "border-utility-success-200",
        text: "text-utility-success-700",
        time: "text-utility-success-600",
        dot: "bg-utility-success-500",
    },
    yellow: {
        bg: "bg-utility-warning-50",
        bg_hover: "hover:bg-utility-warning-100",
        border: "border-utility-warning-200",
        text: "text-utility-warning-700",
        time: "text-utility-warning-600",
        dot: "bg-utility-warning-500",
    },
    indigo: {
        bg: "bg-[#EEF4FF]",
        bg_hover: "hover:bg-[#E0EAFF]",
        border: "border-[#C7D7FE]",
        text: "text-[#3538CD]",
        time: "text-[#444CE7]",
        dot: "bg-[#444CE7]",
    },
    purple: {
        bg: "bg-[#F4F3FF]",
        bg_hover: "hover:bg-[#EBE9FE]",
        border: "border-[#D9D6FE]",
        text: "text-[#5925DC]",
        time: "text-[#6938EF]",
        dot: "bg-[#6938EF]",
    },
};

const sampleEvents: CalendarEvent[] = [
    {
        id: "1",
        title: "Monday standup",
        time: "9:00 AM",
        color: "gray",
        description: "Weekly team sync",
        startDate: new Date(2025, 0, 6),
    },
    {
        id: "2",
        title: "Coffee with Alina",
        time: "11:30 AM",
        color: "brand",
        hasDot: true,
        startDate: new Date(2025, 0, 7),
    },
    {
        id: "3",
        title: "Marketing site design",
        time: "2:30 PM",
        endTime: "4:30 PM",
        color: "indigo",
        startDate: new Date(2025, 0, 8),
    },
    {
        id: "4",
        title: "Product demo",
        time: "10:30 AM",
        endTime: "11:15 AM",
        color: "blue",
        guests: 12,
        startDate: new Date(2025, 0, 10),
    },
    {
        id: "5",
        title: "One-on-one with Sienna",
        time: "10:00 AM",
        color: "pink",
        description: "Performance review",
        startDate: new Date(2025, 0, 13),
    },
    {
        id: "6",
        title: "All-hands meeting",
        time: "4:00 PM",
        endTime: "5:00 PM",
        color: "gray",
        guests: 45,
        startDate: new Date(2025, 0, 16),
    },
    {
        id: "7",
        title: "Dinner with Caitlyn",
        time: "6:30 PM",
        color: "green",
        hasDot: true,
        location: "Italian restaurant",
        startDate: new Date(2025, 0, 16),
    },
    {
        id: "8",
        title: "Friday standup",
        time: "9:00 AM",
        color: "gray",
        startDate: new Date(2025, 0, 10),
    },
    {
        id: "9",
        title: "House inspection",
        time: "10:30 AM",
        color: "orange",
        hasDot: true,
        startDate: new Date(2025, 0, 16),
    },
    {
        id: "10",
        title: "Content planning",
        time: "11:00 AM",
        endTime: "12:30 PM",
        color: "blue",
        startDate: new Date(2025, 0, 20),
    },
    {
        id: "11",
        title: "One-on-one with Eva",
        time: "10:00 AM",
        color: "pink",
        startDate: new Date(2025, 0, 7),
    },
    {
        id: "12",
        title: "Catch up w/ Alex",
        time: "2:30 PM",
        color: "brand",
        hasDot: true,
        startDate: new Date(2025, 0, 7),
    },
    {
        id: "13",
        title: "Deep work",
        time: "9:00 AM",
        endTime: "12:00 PM",
        color: "blue",
        description: "Focus time - no meetings",
        startDate: new Date(2025, 0, 8),
    },
    {
        id: "14",
        title: "Design sync",
        time: "10:30 AM",
        endTime: "11:30 AM",
        color: "indigo",
        startDate: new Date(2025, 0, 8),
    },
    {
        id: "15",
        title: "SEO planning",
        time: "1:30 PM",
        color: "indigo",
        startDate: new Date(2025, 0, 8),
    },
    {
        id: "16",
        title: "Lunch with Olivia",
        time: "12:00 PM",
        color: "green",
        hasDot: true,
        startDate: new Date(2025, 0, 9),
    },
    {
        id: "17",
        title: "Olivia x Riley",
        time: "10:00 AM",
        endTime: "11:00 AM",
        color: "brand",
        startDate: new Date(2025, 0, 10),
    },
    {
        id: "18",
        title: "Product demo",
        time: "1:30 PM",
        endTime: "3:30 PM",
        color: "indigo",
        description:
            "Sienna is inviting you to a scheduled Zoom meeting.\n\nTopic: Product demo for the new dashboard and Q&A session.",
        guests: 6,
        startDate: new Date(2025, 0, 10),
    },
    {
        id: "19",
        title: "Team lunch",
        time: "12:15 PM",
        color: "pink",
        hasDot: true,
        guests: 8,
        startDate: new Date(2025, 0, 13),
    },
    {
        id: "20",
        title: "Amélie's first day",
        time: "10:00 AM",
        color: "pink",
        description: "New team member onboarding",
        startDate: new Date(2025, 0, 16),
    },
    {
        id: "21",
        title: "Coffee w/ Amélie",
        time: "9:30 AM",
        color: "brand",
        hasDot: true,
        startDate: new Date(2025, 0, 17),
    },
    {
        id: "22",
        title: "Design feedback session",
        time: "2:30 PM",
        endTime: "3:30 PM",
        color: "indigo",
        startDate: new Date(2025, 0, 17),
    },
    {
        id: "23",
        title: "Half marathon 🏃",
        time: "7:00 AM",
        color: "green",
        hasDot: true,
        startDate: new Date(2025, 0, 18),
    },
    {
        id: "24",
        title: "Quarterly review",
        time: "11:30 AM",
        endTime: "1:00 PM",
        color: "orange",
        guests: 15,
        startDate: new Date(2025, 0, 21),
    },
    {
        id: "25",
        title: "Lunch with Zahir",
        time: "1:00 PM",
        color: "brand",
        hasDot: true,
        startDate: new Date(2025, 0, 21),
    },
    {
        id: "26",
        title: "Accountant",
        time: "1:45 PM",
        color: "yellow",
        startDate: new Date(2025, 0, 24),
    },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

// --- Fonctions utilitaires ---

function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear()
    );
}

function parseTime(timeStr: string): number {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return 0;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return hours + minutes / 60;
}

function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function packEvents(
    events: CalendarEvent[],
    startHour: number,
    pixelsPerHour: number
): PackedEvent[] {
    if (events.length === 0) return [];

    const processedEvents = events
        .map(event => {
            const eventTime = parseTime(event.time);
            const eventEndTime = event.endTime ? parseTime(event.endTime) : eventTime + 1;

            if (eventTime >= 19 || eventEndTime <= startHour) return null;

            const top = (eventTime - startHour) * pixelsPerHour;
            const durationHours = eventEndTime - eventTime;
            const height = Math.max(durationHours * pixelsPerHour - 4, 40);

            return {
                ...event,
                top,
                height,
                start: eventTime,
                end: eventEndTime,
                column: 0,
                columns: 1,
                left: 0,
                width: 100,
            };
        })
        .filter((e): e is PackedEvent => e !== null)
        .sort((a, b) => a.start - b.start);

    const columns: PackedEvent[][] = [];

    for (const event of processedEvents) {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
            const column = columns[i];
            const lastEvent = column[column.length - 1];

            if (event.start >= lastEvent.end) {
                event.column = i;
                column.push(event);
                placed = true;
                break;
            }
        }
        if (!placed) {
            event.column = columns.length;
            columns.push([event]);
        }
    }

    processedEvents.forEach(event => {
        let maxOverlap = event.column;

        for (const otherEvent of processedEvents) {
            if (
                otherEvent !== event &&
                Math.max(event.start, otherEvent.start) < Math.min(event.end, otherEvent.end)
            ) {
                maxOverlap = Math.max(maxOverlap, otherEvent.column);
            }
        }

        event.columns = maxOverlap + 1;
        const totalWidth = 1 / event.columns;
        event.left = event.column * totalWidth * 100;
        event.width = totalWidth * 100 - 1;
    });

    return processedEvents;
}

function generateCalendarDays(
    year: number,
    month: number,
    selectedDate: Date | null,
    today: Date,
    events: CalendarEvent[]
): CalendarDay[][] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevMonthLastDay = new Date(year, month, 0);

    const firstDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const weeks: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const date = prevMonthLastDay.getDate() - i;
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const currentDayDate = new Date(prevYear, prevMonth, date);

        const dayEvents = events.filter(e => isSameDay(e.startDate, currentDayDate));

        currentWeek.push({
            date,
            month: prevMonth,
            year: prevYear,
            events: dayEvents,
            isDisabled: true,
        });
    }

    for (let date = 1; date <= lastDay.getDate(); date++) {
        const currentDayDate = new Date(year, month, date);
        const dayEvents = events.filter(e => isSameDay(e.startDate, currentDayDate));
        const isTodayDate = isSameDay(today, currentDayDate);
        const isSelected = selectedDate ? isSameDay(selectedDate, currentDayDate) : false;

        currentWeek.push({
            date,
            month,
            year,
            events: dayEvents,
            isToday: isTodayDate,
            isSelected,
            isDisabled: false,
        });

        if (currentWeek.length === 7) {
            weeks.push(currentWeek);
            currentWeek = [];
        }
    }

    if (currentWeek.length > 0) {
        const remainingDays = 7 - currentWeek.length;
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        for (let date = 1; date <= remainingDays; date++) {
            const currentDayDate = new Date(nextYear, nextMonth, date);
            const dayEvents = events.filter(e => isSameDay(e.startDate, currentDayDate));

            currentWeek.push({
                date,
                month: nextMonth,
                year: nextYear,
                events: dayEvents,
                isDisabled: true,
            });
        }
        weeks.push(currentWeek);
    }

    return weeks;
}

const CalendarEventItem = ({
    event,
    onClick,
    viewMode,
}: {
    event: CalendarEvent;
    onClick: (e: React.MouseEvent) => void;
    viewMode: ViewMode;
}) => {
    const styles = eventColorStyles[event.color];
    const isSmall = viewMode === "month";

    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-1 rounded-sm border transition-all cursor-pointer",
                isSmall ? "px-1.5 md:px-2 py-1" : "p-2",
                styles.bg,
                styles.bg_hover,
                styles.border
            )}
        >
            {event.hasDot && (
                <div
                    className={cn(
                        "rounded-full flex-shrink-0",
                        isSmall ? "w-1.5 h-1.5" : "w-2 h-2",
                        styles.dot
                    )}
                />
            )}
            <div className="flex flex-1 items-center gap-0.5 min-w-0">
                <span
                    className={cn(
                        "flex-1 truncate font-semibold",
                        isSmall ? "text-[10px] md:text-xs" : "text-sm",
                        styles.text
                    )}
                >
                    {event.title}
                </span>
                {event.time && (
                    <span
                        className={cn(
                            "truncate font-medium",
                            isSmall ? "hidden md:inline text-[10px]" : "text-xs",
                            styles.time
                        )}
                    >
                        {event.time}
                    </span>
                )}
            </div>
        </div>
    );
};

export function Calendars() {
    const today = useMemo(() => new Date(2025, 0, 16), []);
    const [currentDate, setCurrentDate] = useState(new Date(2025, 0, 10));
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2025, 0, 10));
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const pixelsPerHour = 96;

    const calendarDays = useMemo(
        () => generateCalendarDays(year, month, selectedDate, today, sampleEvents),
        [year, month, selectedDate, today]
    );

    const goToPreviousPeriod = useCallback(() => {
        if (viewMode === "month") {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        } else if (viewMode === "week") {
            setCurrentDate(prev => new Date(prev.getTime() - 7 * 24 * 60 * 60 * 1000));
        } else {
            const newDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
            setCurrentDate(newDate);
            setSelectedDate(newDate);
        }
    }, [viewMode, currentDate]);

    const goToNextPeriod = useCallback(() => {
        if (viewMode === "month") {
            setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        } else if (viewMode === "week") {
            setCurrentDate(prev => new Date(prev.getTime() + 7 * 24 * 60 * 60 * 1000));
        } else {
            const newDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
            setCurrentDate(newDate);
            setSelectedDate(newDate);
        }
    }, [viewMode, currentDate]);

    const goToToday = useCallback(() => {
        setCurrentDate(today);
        setSelectedDate(today);
    }, [today]);

    const handleDateClick = useCallback((day: CalendarDay) => {
        if (!day.isDisabled) {
            const newDate = new Date(day.year, day.month, day.date);
            setSelectedDate(newDate);
            setCurrentDate(newDate);
            setViewMode("day");
        }
    }, []);

    const handleEventClick = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedEvent(event);
    }, []);

    const getCurrentWeekDays = useCallback(() => {
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        const weekDaysData: CalendarDay[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);

            const dayEvents = sampleEvents
                .filter(e => isSameDay(e.startDate, date))
                .sort((a, b) => parseTime(a.time) - parseTime(b.time));

            weekDaysData.push({
                date: date.getDate(),
                month: date.getMonth(),
                year: date.getFullYear(),
                events: dayEvents,
                isToday: isSameDay(date, today),
                isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
                isDisabled: false,
            });
        }
        return weekDaysData;
    }, [currentDate, selectedDate, today]);

    const getTimeSlots = () => {
        const slots = [];
        for (let hour = 8; hour <= 18; hour++) {
            const ampm = hour < 12 ? "AM" : "PM";
            const displayHour = hour % 12 || 12;
            slots.push({ hour, label: `${displayHour} ${ampm}` });
        }
        return slots;
    };

    const getDateRangeText = () => {
        if (viewMode === "month") {
            const start = new Date(year, month, 1);
            const end = new Date(year, month + 1, 0);
            return `${monthNames[month].substring(0, 3)} ${start.getDate()}, ${year} – ${monthNames[month].substring(0, 3)} ${end.getDate()}, ${year}`;
        }

        if (viewMode === "week") {
            const week = getCurrentWeekDays();
            const start = week[0];
            const end = week[6];
            return `${monthNames[start.month].substring(0, 3)} ${start.date}, ${year} - ${monthNames[end.month].substring(0, 3)} ${end.date}, ${year}`;
        }

        const d = selectedDate || currentDate;
        return d.toLocaleDateString("en-US", { weekday: "long" });
    };

    const renderMonthView = () => (
        <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-7">
                {weekDays.map((dayName, index) => (
                    <div
                        key={index}
                        className="border-b border-r border-secondary p-2 text-center bg-primary last:border-r-0"
                    >
                        <span className="text-xs font-medium text-quaternary">{dayName}</span>
                    </div>
                ))}
            </div>
            {calendarDays.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7">
                    {week.map((day, dayIndex) => {
                        const displayedEvents = day.events.slice(0, 3);
                        const moreCount = day.events.length > 3 ? day.events.length - 3 : 0;

                        return (
                            <div
                                key={`${weekIndex}-${dayIndex}`}
                                onClick={() => handleDateClick(day)}
                                className={cn(
                                    "flex min-h-[100px] md:min-h-[120px] flex-col gap-1 border-b border-r border-secondary p-2 last:border-r-0 transition-colors",
                                    day.isDisabled
                                        ? "bg-secondary_subtle cursor-default"
                                        : "bg-primary hover:bg-primary_hover cursor-pointer"
                                )}
                            >
                                <div
                                    className={cn(
                                        "flex items-center justify-center size-6 rounded-full transition-colors",
                                        day.isSelected && "bg-brand-solid",
                                        day.isToday && !day.isSelected && "bg-active"
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "text-xs font-semibold",
                                            day.isSelected
                                                ? "text-white"
                                                : day.isDisabled
                                                  ? "text-disabled"
                                                  : day.isToday
                                                    ? "text-secondary"
                                                    : "text-secondary"
                                        )}
                                    >
                                        {day.date}
                                    </span>
                                </div>

                                <div
                                    className={cn(
                                        "flex flex-col gap-1"
                                        // day.isDisabled && "opacity-50 pointer-events-none"
                                    )}
                                >
                                    {displayedEvents.map(event => (
                                        <CalendarEventItem
                                            key={event.id}
                                            event={event}
                                            viewMode="month"
                                            onClick={e => handleEventClick(event, e)}
                                        />
                                    ))}
                                    {moreCount > 0 && (
                                        <button className="px-2 text-left cursor-pointer">
                                            <span className="text-xs font-semibold text-utility-gray-500">
                                                {moreCount} more...
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    const renderWeekView = () => {
        const weekDaysData = getCurrentWeekDays();
        const timeSlots = getTimeSlots();
        const startHour = 8;

        return (
            <div className="flex-1 overflow-auto">
                <div className="min-w-[700px]">
                    <div className="sticky top-0 z-20 border-b border-secondary">
                        <div className="grid grid-cols-8">
                            <div className="border-r border-secondary p-3 bg-primary" />
                            {weekDaysData.map((day, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        "border-r flex flex-col md:flex-row items-center gap-1 border-secondary p-3 text-center cursor-pointer transition-colors last:border-r-0"
                                    )}
                                    onClick={() => handleDateClick(day)}
                                >
                                    <div className="text-xs font-medium text-quaternary">
                                        {weekDays[idx]}
                                    </div>
                                    <div
                                        className={cn(
                                            "inline-flex size-6 items-center justify-center rounded-full transition-colors",
                                            day.isSelected && "bg-brand-solid text-white",
                                            day.isToday && !day.isSelected && "bg-active"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "text-xs font-semibold",
                                                day.isSelected ? "text-white" : "text-secondary"
                                            )}
                                        >
                                            {day.date}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="grid grid-cols-8">
                            <div className="flex flex-col">
                                {timeSlots.map((slot, idx) => (
                                    <div
                                        key={idx}
                                        className="h-24 border-b border-r border-secondary p-2 bg-secondary_subtle"
                                    >
                                        <span className="text-xs font-medium text-quaternary">
                                            {slot.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {weekDaysData.map((day, dayIdx) => {
                                const packedEvents = packEvents(
                                    day.events,
                                    startHour,
                                    pixelsPerHour
                                );

                                return (
                                    <div
                                        key={dayIdx}
                                        className="relative flex flex-col border-r border-secondary last:border-r-0"
                                    >
                                        {timeSlots.map((slot, slotIdx) => (
                                            <div
                                                key={slotIdx}
                                                className="h-24 border-b border-secondary hover:bg-primary_hover transition-colors"
                                            />
                                        ))}

                                        {packedEvents.map(event => {
                                            const styles = eventColorStyles[event.color];
                                            return (
                                                <div
                                                    key={event.id}
                                                    onClick={e => handleEventClick(event, e)}
                                                    className={cn(
                                                        "absolute rounded-sm border p-2 cursor-pointer transition-all z-10 overflow-hidden",
                                                        styles.bg,
                                                        styles.border
                                                    )}
                                                    style={{
                                                        top: `${event.top}px`,
                                                        height: `${event.height}px`,
                                                        left: `${event.left}%`,
                                                        width: `${event.width}%`,
                                                    }}
                                                >
                                                    <div className="flex items-start gap-1.5">
                                                        {event.hasDot && (
                                                            <div
                                                                className={cn(
                                                                    "size-1.5 rounded-full mt-1 flex-shrink-0",
                                                                    styles.dot
                                                                )}
                                                            />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div
                                                                className={cn(
                                                                    "text-xs font-semibold truncate",
                                                                    styles.text
                                                                )}
                                                            >
                                                                {event.title}
                                                            </div>
                                                            <div
                                                                className={cn(
                                                                    "text-xs mt-0.5",
                                                                    styles.time
                                                                )}
                                                            >
                                                                {event.time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const timeSlots = getTimeSlots();
        const startHour = 8;
        const currentDayDate = selectedDate || currentDate;

        const dayEvents = sampleEvents
            .filter(e => isSameDay(e.startDate, currentDayDate))
            .sort((a, b) => parseTime(a.time) - parseTime(b.time));

        const packedEvents = packEvents(dayEvents, startHour, pixelsPerHour);

        const currentTime = new Date();
        const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60;
        const showTimeline =
            isSameDay(currentDayDate, today) && currentHour >= startHour && currentHour <= 18;
        const timelinePosition = showTimeline ? (currentHour - startHour) * pixelsPerHour : 0;

        const highlightedDates = sampleEvents.map(e => e.startDate);

        return (
            <div className="flex items-start flex-1 self-stretch">
                <div className="flex h-[822px] flex-col items-start flex-1 border-r border-secondary relative">
                    <div className="flex items-start flex-1 self-stretch overflow-auto">
                        <div className="w-[72px] flex flex-col border-r border-secondary bg-secondary_subtle">
                            {timeSlots.map((slot, idx) => (
                                <div key={idx} className="h-24 flex flex-col items-start relative">
                                    <div
                                        className={cn(
                                            "absolute -right-2 -top-2.5 pr-3 text-xs font-medium text-quaternary text-right",
                                            idx === 0 && "-top-0.5"
                                        )}
                                    >
                                        {slot.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col items-start flex-1 relative min-w-[300px]">
                            {Array.from({ length: timeSlots.length }).map((_, rowIndex) => (
                                <div
                                    key={rowIndex}
                                    className="flex flex-col items-start self-stretch "
                                >
                                    <div className="flex h-12 px-2 py-2 flex-col items-start self-stretch border-r border-b border-secondary hover:bg-primary_hover" />
                                    <div className="flex h-12 px-2 py-2 flex-col items-start self-stretch border-r border-b border-secondary hover:bg-primary_hover" />
                                </div>
                            ))}

                            {packedEvents.map(event => {
                                const styles = eventColorStyles[event.color];
                                return (
                                    <div
                                        key={event.id}
                                        className="absolute left-0 right-0 px-1.5 cursor-pointer"
                                        style={{
                                            top: `${event.top}px`,
                                            height: `${event.height}px`,
                                        }}
                                        onClick={e => handleEventClick(event, e)}
                                    >
                                        <div
                                            className={cn(
                                                "flex px-2 py-1.5 items-start gap-1 flex-1 self-stretch rounded-sm border h-full transition-all",
                                                styles.bg,
                                                styles.border
                                            )}
                                        >
                                            <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
                                                <div className="flex items-start gap-0.5 self-stretch">
                                                    {event.hasDot && (
                                                        <div
                                                            className={cn(
                                                                "w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0",
                                                                styles.dot
                                                            )}
                                                        />
                                                    )}
                                                    <div
                                                        className="flex-1 text-xs font-semibold line-clamp-2"
                                                        style={{ color: styles.text }}
                                                    >
                                                        {event.title}
                                                    </div>
                                                </div>
                                                {event.height > 50 && (
                                                    <div
                                                        className="self-stretch text-xs font-normal line-clamp-1"
                                                        style={{ color: styles.time }}
                                                    >
                                                        {event.time}
                                                        {event.endTime && ` - ${event.endTime}`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {showTimeline && (
                                <div
                                    className="absolute left-0 right-0 flex items-center gap-1 z-20 pointer-events-none"
                                    style={{ top: `${timelinePosition}px` }}
                                >
                                    <div className="w-16 flex-shrink-0 text-xs font-medium text-brand-solid text-right -ml-[72px]">
                                        {currentTime.toLocaleTimeString("en-US", {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                        })}
                                    </div>
                                    <div className="flex items-center gap-0 flex-1">
                                        <div className="w-2 h-2 rounded-full bg-brand-solid" />
                                        <div className="h-px flex-1 bg-brand-solid" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-start self-stretch w-[328px] border-l border-secondary">
                    <div className="flex w-full items-start border-b border-secondary">
                        <div className="flex flex-col items-center flex-1">
                            <div className="flex p-5 md:p-6 flex-col items-start gap-4 self-stretch">
                                <div className="flex flex-col items-start gap-3 self-stretch">
                                    <div className="flex items-start self-stretch flex-wrap gap-y-1">
                                        <MiniCalendar
                                            mode="single"
                                            required={true}
                                            selected={selectedDate || undefined}
                                            onSelect={(date: Date) => {
                                                if (!date) return;
                                                setSelectedDate(date);
                                                setCurrentDate(date);
                                            }}
                                            month={currentDate}
                                            onMonthChange={setCurrentDate}
                                            highlightedDates={highlightedDates}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedEvent && (
                        <div className="flex p-5 md:p-6 flex-col items-start gap-5 flex-1 self-stretch relative overflow-y-auto">
                            <div className="flex flex-col items-start gap-5 self-stretch relative z-10">
                                <div className="absolute -right-4 -top-4 flex items-start gap-0.5">
                                    <ButtonUtility
                                        variant={"tertiary"}
                                        size={"xs"}
                                        icon={Copy01}
                                        tooltip="Copy link"
                                    />
                                    <ButtonUtility
                                        variant={"tertiary"}
                                        size={"xs"}
                                        icon={Trash01}
                                        tooltip="Delete"
                                    />
                                    <ButtonUtility
                                        variant={"tertiary"}
                                        size={"xs"}
                                        icon={Edit01}
                                        tooltip="Edit"
                                    />
                                </div>
                                <div className="flex flex-col items-start gap-2 self-stretch">
                                    <div className="self-stretch text-base font-semibold text-primary">
                                        {selectedEvent.title}
                                    </div>
                                    <div className="flex flex-col items-start gap-1.5 self-stretch">
                                        <div className="flex items-center gap-1.5 self-stretch">
                                            <Calendar className="w-4 h-4 text-fg-quaternary flex-shrink-0" />
                                            <div className="flex-1 text-sm text-tertiary line-clamp-1">
                                                {selectedEvent.startDate.toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        weekday: "long",
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    }
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 self-stretch">
                                            <Clock className="w-4 h-4 text-fg-quaternary flex-shrink-0" />
                                            <div className="flex-1 text-sm text-tertiary line-clamp-1">
                                                {selectedEvent.time}
                                                {selectedEvent.endTime &&
                                                    ` - ${selectedEvent.endTime}`}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 self-stretch">
                                            <BellRinging01 className="w-4 h-4 text-fg-quaternary flex-shrink-0" />
                                            <div className="flex-1 text-sm text-tertiary line-clamp-1">
                                                {selectedEvent.reminder || 10} minutes before
                                            </div>
                                        </div>
                                        {selectedEvent.location && (
                                            <div className="flex items-center gap-1.5 self-stretch">
                                                <Map01 className="w-4 h-4 text-fg-quaternary flex-shrink-0" />
                                                <div className="flex-1 text-sm text-tertiary line-clamp-1">
                                                    {selectedEvent.location}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedEvent.guests && (
                                    <div className="flex flex-col items-start gap-3 self-stretch">
                                        <div className="flex gap-2">
                                            <AvatarGroup
                                                size="sm"
                                                max={Math.min(5, selectedEvent.guests)}
                                                items={[
                                                    { src: "/images/avatar-1.png", alt: "User 1" },
                                                    { src: "/images/avatar-2.png", alt: "User 2" },
                                                    { src: "/images/avatar-3.png", alt: "User 3" },
                                                    { src: "/images/avatar-4.png", alt: "User 4" },
                                                    { initials: "AB" },
                                                    { initials: "CD" },
                                                ]}
                                            />
                                            <AvatarAddButton size="sm" />
                                        </div>

                                        <div className="flex items-center gap-2 self-stretch text-sm">
                                            <span className="font-semibold text-primary">
                                                {selectedEvent.guests} guests
                                            </span>
                                            <div className="w-0 h-3 border-l border-gray-300" />
                                            <span className="text-gray-700">
                                                {selectedEvent.guests - 1} yes
                                            </span>
                                            <div className="w-0 h-3 border-l border-gray-300" />
                                            <span className="text-gray-700">1 awaiting</span>
                                        </div>
                                    </div>
                                )}

                                {selectedEvent.description && (
                                    <div className="flex flex-col items-start gap-2 self-stretch">
                                        <div className="self-stretch text-sm font-semibold text-gray-900">
                                            About this event
                                        </div>
                                        <div className="self-stretch text-sm text-gray-700 whitespace-pre-line">
                                            {selectedEvent.description}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const displayDate = viewMode === "day" ? selectedDate || currentDate : currentDate;

    return (
        <div className="flex flex-col lg:flex-row w-full max-w-[1400px] gap-4 p-4">
            <div className="flex flex-col flex-1 rounded-xl ring-1 ring-border-secondary bg-primary shadow-xs overflow-hidden">
                <div className="flex flex-col border-b border-secondary bg-primary">
                    <div className="flex flex-col md:flex-row items-start gap-4 p-5 md:p-6">
                        <div className="flex flex-1 items-start gap-3 w-full md:w-auto">
                            <div className="flex w-16 flex-col items-center rounded-md border border-secondary bg-primary shadow-xs">
                                <div className="flex w-full items-center justify-center bg-secondary px-2 pt-1 pb-0.5 rounded-t-md">
                                    <span className="text-xs font-semibold text-quaternary">
                                        {monthNames[displayDate.getMonth()]
                                            .substring(0, 3)
                                            .toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex w-full items-center justify-center px-2 py-1">
                                    <span className="text-lg font-bold text-brand-secondary">
                                        {displayDate.getDate()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-1 flex-col justify-center gap-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-lg font-semibold text-primary">
                                        {monthNames[currentDate.getMonth()]}
                                        {currentDate.getFullYear()}
                                    </h2>
                                    <Badge variant={"modern"} size="sm">
                                        Week {getWeekNumber(currentDate)}
                                    </Badge>
                                </div>
                                <p className="text-sm text-tertiary">{getDateRangeText()}</p>
                            </div>
                        </div>

                        <div className="flex items-center flex-col-reverse md:flex-row gap-3 ">
                            <div className="w-full md:w-auto">
                                <ButtonGroup
                                    size="md"
                                    items={[
                                        { leftIcon: ChevronLeft, action: goToPreviousPeriod },
                                        {
                                            label: "Today",
                                            action: goToToday,
                                            className: "w-full md:w-auto",
                                        },
                                        { leftIcon: ChevronRight, action: goToNextPeriod },
                                    ]}
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <Select
                                    size="sm"
                                    placeholder={`${viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view`}
                                    items={[
                                        { id: "month", label: "Month view" },
                                        { id: "week", label: "Week view" },
                                        { id: "day", label: "Day view" },
                                    ]}
                                    value={viewMode}
                                    onValueChange={value => setViewMode(value as ViewMode)}
                                />

                                <Button size="md" leftIcon={Plus}>
                                    Add event
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden">
                    {viewMode === "month" && renderMonthView()}
                    {viewMode === "week" && renderWeekView()}
                    {viewMode === "day" && renderDayView()}
                </div>
            </div>

            {/* {showEventPanel && selectedEvent && (
                <EventPanel event={selectedEvent} onClose={() => setShowEventPanel(false)} />
            )} */}
        </div>
    );
}
