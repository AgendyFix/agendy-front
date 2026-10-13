"use client";

import { Input } from "@/components/ui/input";
import { parseMoney } from "./constants";

interface MoneyInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  "aria-label": string;
  id?: string;
}

/** Input numérico con prefijo "$" y sufijo "MXN" (enteros >= 0). */
export function MoneyInput({ value, onChange, id, "aria-label": ariaLabel }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
      <Input
        id={id}
        aria-label={ariaLabel}
        inputMode="numeric"
        className="pl-7 pr-14"
        value={value === null ? "" : String(value)}
        onChange={(e) => onChange(parseMoney(e.target.value))}
        placeholder="0"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">MXN</span>
    </div>
  );
}
