"use client";

// ============================================
// PUBLIC LINK CARD - Link público (solo lectura), copiar/abrir y estado de publicación
// ============================================

import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicPageSettings } from "@/lib/types/models";

export function PublicLinkCard({ settings }: { settings: PublicPageSettings }) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(settings.public_url);
      toast.success("Link copiado");
    } catch {
      toast.error("No se pudo copiar el link");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Tu link</CardTitle>
        <CardDescription>
          {settings.public_page_enabled
            ? "Tu página está publicada. Compártela en tu bio de Instagram."
            : "Tu página aún no está publicada; contacta a AgendyFix."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={settings.public_url} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href={settings.public_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir
              </a>
            </Button>
          </div>
        </div>
        {settings.instagram_handle && (
          <p className="text-sm text-muted-foreground">
            Instagram: <span className="font-medium text-foreground">@{settings.instagram_handle}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
