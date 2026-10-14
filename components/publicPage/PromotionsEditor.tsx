"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicPromotion } from "@/lib/types/models";
import { MoneyInput } from "./MoneyInput";
import { ToggleSwitch } from "./ToggleSwitch";
import { MAX_PROMOTIONS } from "./constants";

interface PromotionsEditorProps {
  value: PublicPromotion[];
  onChange: (value: PublicPromotion[]) => void;
}

export function PromotionsEditor({ value, onChange }: PromotionsEditorProps) {
  const update = (index: number, patch: Partial<PublicPromotion>) =>
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-sm text-muted-foreground">Aún no agregas promociones.</p>}
      {value.map((row, index) => (
        <div key={index} className="space-y-2 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Input
              aria-label={`Nombre de la promoción ${index + 1}`}
              className="flex-1"
              maxLength={80}
              value={row.name}
              onChange={(e) => update(index, { name: e.target.value })}
              placeholder="Nombre (ej. Inscripción gratis en febrero)"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Quitar promoción ${index + 1}`}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-start gap-3">
            <div className="w-36 space-y-1">
              <MoneyInput
                aria-label={`Precio de la promoción ${index + 1} en MXN`}
                value={row.price}
                onChange={(price) => update(index, { price })}
              />
              <p className="text-xs text-muted-foreground">0 = gratis</p>
            </div>
            <div className="min-w-48 flex-1">
              <Input
                aria-label={`Descripción de la promoción ${index + 1}`}
                maxLength={200}
                value={row.description}
                onChange={(e) => update(index, { description: e.target.value })}
                placeholder="Descripción (opcional)"
              />
            </div>
          </div>
          <ToggleSwitch
            label="Activa"
            checked={row.is_active}
            onCheckedChange={(is_active) => update(index, { is_active })}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={value.length >= MAX_PROMOTIONS}
        onClick={() => onChange([...value, { name: "", price: null, description: "", is_active: true }])}
      >
        <Plus className="mr-2 h-4 w-4" />
        Agregar promoción
      </Button>
    </div>
  );
}
