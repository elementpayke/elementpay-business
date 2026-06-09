"use client";

import { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

interface DatePickerProps {
  id?: string;
  value: string; // "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
}

function parseIso(value: string): Date | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return undefined;
  const [, y, mo, d] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Select date",
  ariaLabel,
  minYear,
  maxYear,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseIso(value), [value]);
  const today = new Date();
  const [month, setMonth] = useState<Date>(selected ?? today);

  const fromDate = minYear ? new Date(minYear, 0, 1) : undefined;
  const toDate = maxYear ? new Date(maxYear, 11, 31) : undefined;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel}
          disabled={disabled}
          className="flex w-full h-10 items-center justify-between rounded-lg border-0 bg-gray-100 dark:bg-gray-800/70 px-3 text-sm text-left transition focus:outline-none focus:ring-2 focus:ring-primary-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span className={selected ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}>
            {selected ? formatDisplay(selected) : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 shadow-xl"
        >
          <DayPicker
            mode="single"
            selected={selected}
            month={month}
            onMonthChange={setMonth}
            onSelect={(d) => {
              if (d) {
                onChange(toIso(d));
                setOpen(false);
              }
            }}
            captionLayout="dropdown"
            startMonth={fromDate}
            endMonth={toDate}
            showOutsideDays
            classNames={{
              root: "rdp text-sm",
              month_caption: "flex items-center justify-center pt-1 pb-2 text-sm font-medium text-gray-900 dark:text-white",
              caption_label: "hidden",
              dropdowns: "flex gap-2 items-center",
              dropdown: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-2 py-1 text-xs border-0 focus:outline-none focus:ring-2 focus:ring-primary-500/25",
              months: "",
              month: "",
              weekdays: "flex",
              weekday: "w-8 h-8 flex items-center justify-center text-[11px] font-medium text-gray-500 dark:text-gray-400",
              week: "flex",
              day: "w-8 h-8 p-0",
              day_button: "w-8 h-8 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500/25",
              selected: "[&_button]:bg-primary-500 [&_button]:text-white [&_button]:hover:bg-primary-600",
              today: "[&_button]:font-semibold [&_button]:text-primary-500",
              outside: "[&_button]:text-gray-300 dark:[&_button]:text-gray-600",
              disabled: "[&_button]:opacity-40 [&_button]:cursor-not-allowed",
              nav: "absolute top-2 right-2 flex gap-1",
              button_previous: "h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500",
              button_next: "h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500",
            }}
            components={{
              Chevron: ({ orientation }) =>
                orientation === "left" ? (
                  <ChevronLeft className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                ),
            }}
          />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
