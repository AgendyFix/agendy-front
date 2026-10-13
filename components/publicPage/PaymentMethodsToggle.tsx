"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PaymentMethodCode } from "@/lib/types/models";
import { PAYMENT_METHODS } from "./constants";

interface PaymentMethodsToggleProps {
  value: PaymentMethodCode[];
  onChange: (value: PaymentMethodCode[]) => void;
}

export function PaymentMethodsToggle({ value, onChange }: PaymentMethodsToggleProps) {
  const toggle = (code: PaymentMethodCode) =>
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);

  return (
    <div className="flex flex-wrap gap-2">
      {PAYMENT_METHODS.map(({ code, label }) => {
        const active = value.includes(code);
        return (
          <button
            key={code}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(code)}
            className={cn(
              "inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-input bg-background text-muted-foreground hover:bg-accent"
            )}
          >
            {active && <Check className="h-4 w-4" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
