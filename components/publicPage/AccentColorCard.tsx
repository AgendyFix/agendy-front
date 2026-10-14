"use client";

// ============================================
// ACCENT COLOR CARD - Color del sitio público: sugeridos, personalizado y restablecer
// ============================================

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pickTextOn } from "@/lib/color";
import { ACCENT_SWATCHES } from "./constants";

interface AccentColorCardProps {
  /** Color base de AgendyFix. */
  baseColor: string;
  /** Color elegido por la academia; "" = usa el base. */
  value: string;
  onChange: (hex: string) => void;
  error?: string;
}

export function AccentColorCard({ baseColor, value, onChange, error }: AccentColorCardProps) {
  const effective = value || baseColor;
  const textColor = pickTextOn(effective);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Color de tu sitio</CardTitle>
        <CardDescription>Se usa en los botones y detalles de tu página.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {ACCENT_SWATCHES.map(({ name, hex }) => {
            const selected = effective.toLowerCase() === hex.toLowerCase();
            return (
              <button
                key={hex}
                type="button"
                aria-pressed={selected}
                aria-label={name}
                title={name}
                onClick={() => onChange(hex)}
                className={`h-9 w-9 rounded-full border border-border transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selected ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label="Color personalizado"
            value={effective.toLowerCase()}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent p-0.5"
          />
          <span className="font-mono text-sm">{effective.toUpperCase()}</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-auto"
            disabled={!value}
            onClick={() => onChange("")}
          >
            Restablecer
          </Button>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
          <span
            className="rounded-full px-4 py-1.5 text-sm font-medium"
            style={{ backgroundColor: effective, color: textColor }}
          >
            Reservar clase
          </span>
          <span
            className="rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: effective, color: effective }}
          >
            Urbano
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span
            className="h-3 w-3 rounded-full border border-border"
            style={{ backgroundColor: baseColor }}
          />
          Color base de AgendyFix: <span className="font-mono">{baseColor.toUpperCase()}</span>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
