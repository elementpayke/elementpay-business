"use client";

import * as RxSelect from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { type ReactNode } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}

export default function Select({
  id,
  value,
  onChange,
  options,
  placeholder = "Select",
  ariaLabel,
  disabled,
  className,
}: SelectProps) {
  return (
    <RxSelect.Root value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <RxSelect.Trigger
        id={id}
        aria-label={ariaLabel}
        className={
          className ??
          `flex w-full h-10 items-center justify-between rounded-lg border-0 bg-gray-100 dark:bg-gray-800/70 px-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary-500/25 disabled:opacity-60 disabled:cursor-not-allowed ${
            value ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
          }`
        }
      >
        <RxSelect.Value placeholder={placeholder} />
        <RxSelect.Icon asChild>
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </RxSelect.Icon>
      </RxSelect.Trigger>

      <RxSelect.Portal>
        <RxSelect.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-64 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-xl"
        >
          <RxSelect.ScrollUpButton className="flex h-6 items-center justify-center bg-white dark:bg-gray-900 text-gray-400">
            <ChevronUp className="h-3.5 w-3.5" />
          </RxSelect.ScrollUpButton>
          <RxSelect.Viewport className="p-1">
            {options.map((opt) => (
              <Item key={opt.value} value={opt.value}>
                {opt.label}
              </Item>
            ))}
          </RxSelect.Viewport>
          <RxSelect.ScrollDownButton className="flex h-6 items-center justify-center bg-white dark:bg-gray-900 text-gray-400">
            <ChevronDown className="h-3.5 w-3.5" />
          </RxSelect.ScrollDownButton>
        </RxSelect.Content>
      </RxSelect.Portal>
    </RxSelect.Root>
  );
}

function Item({ value, children }: { value: string; children: ReactNode }) {
  return (
    <RxSelect.Item
      value={value}
      className="relative flex h-8 cursor-pointer items-center rounded-md pl-7 pr-2 text-sm text-gray-900 dark:text-white outline-none data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-800 data-[disabled]:opacity-40"
    >
      <RxSelect.ItemIndicator className="absolute left-1.5 inline-flex items-center">
        <Check className="h-3.5 w-3.5 text-primary-500" />
      </RxSelect.ItemIndicator>
      <RxSelect.ItemText>{children}</RxSelect.ItemText>
    </RxSelect.Item>
  );
}
