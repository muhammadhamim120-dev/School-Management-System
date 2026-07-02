"use client";
import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FilterOption = { label: string; value: string };

export function TableFilter({
  placeholder,
  value,
  options,
  onChange,
  width = "w-[150px]",
}: {
  placeholder: string;
  value: string | undefined;
  options: FilterOption[];
  onChange: (value: string | undefined) => void;
  width?: string;
}) {
  const ALL = "__all__";
  return (
    <Select
      value={value ?? ALL}
      onValueChange={(v) => onChange(v === ALL ? undefined : v)}
    >
      <SelectTrigger className={`h-9 ${width}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{placeholder}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
