"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicPrice } from "@/lib/types/models";
import { MoneyInput } from "./MoneyInput";
import { MAX_PRICES } from "./constants";

interface PricesEditorProps {
  value: PublicPrice[];
  onChange: (value: PublicPrice[]) => void;
}

export function PricesEditor({ value, onChange }: PricesEditorProps) {
  const update = (index: number, patch: Partial<PublicPrice>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-sm text-muted-foreground">Aún no agregas precios.</p>}
      {value.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            aria-label={`Concepto del precio ${index + 1}`}
            className="flex-1"
            maxLength={80}
            value={row.name}
            onChange={(e) => update(index, { name: e.target.value })}
            placeholder="Concepto (ej. Una disciplina)"
          />
          <div className="w-36 shrink-0">
            <MoneyInput
              aria-label={`Precio ${index + 1} en MXN`}
              value={row.price}
              onChange={(price) => update(index, { price: price ?? 0 })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Quitar precio ${index + 1}`}
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={value.length >= MAX_PRICES}
        onClick={() => onChange([...value, { name: "", price: 0 }])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar precio
      </Button>
    </div>
  );
}
