"use client";
import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { cn } from "@/utils";
import { Check, ChevronDown } from "lucide-react";

export interface SelectRootProps {
  label?: string;
  helper?: string;
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export function Select({ label, helper, value, onValueChange, children, className, containerClassName }: SelectRootProps) {
  return (
    <div className={cn("flex flex-col gap-1 min-w-[150px] w-full", containerClassName)}>
      {label && <label className="text-[11px] font-medium text-muted-foreground tracking-wide flex items-center gap-1">{label}</label>}
      <RadixSelect.Root value={value} onValueChange={onValueChange}>
        <RadixSelect.Trigger className={cn(
          "inline-flex w-full items-center justify-between gap-2 rounded-md border border-neutral-700/60 bg-neutral-900/70 dark:bg-neutral-900 px-3 py-1.5 text-sm h-9 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none transition-colors data-[placeholder]:text-muted-foreground",
          className
        )}>
          <RadixSelect.Value />
          <RadixSelect.Icon>
            <ChevronDown className="size-4 opacity-70" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className="z-50 overflow-hidden rounded-md border border-neutral-700/70 bg-neutral-900 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95">
            <RadixSelect.Viewport className="p-1">
              {children}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {helper && <p className="text-[10px] text-muted-foreground/70">{helper}</p>}
    </div>
  );
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  return (
    <RadixSelect.Item
      value={value}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm px-3 pr-8 py-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=checked]:font-medium",
        className
      )}
    >
      <RadixSelect.ItemIndicator className="absolute right-2 inline-flex items-center">
        <Check className="size-4" />
      </RadixSelect.ItemIndicator>
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
    </RadixSelect.Item>
  );
}
