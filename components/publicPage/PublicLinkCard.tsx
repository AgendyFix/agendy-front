"use client";

// ============================================
// PUBLIC LINK CARD - Link público (solo lectura), copiar/abrir, logo e Instagram
// ============================================

import { useState } from "react";
import { Copy, ExternalLink, Instagram } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicPageSettings } from "@/lib/types/models";

function initials(slug: string): string {
  const parts = slug.split(/[-_\s]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : slug.slice(0, 2)).toUpperCase();
}

function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function PublicLinkCard({ settings }: { settings: PublicPageSettings }) {
  const [logoFailed, setLogoFailed] = useState(false);

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
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {settings.logo_url && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt="Logo de tu academia"
              className="h-16 w-16 shrink-0 rounded-full border object-cover"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary"
            >
              {initials(settings.slug)}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <a
              href={settings.public_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-lg font-semibold text-primary hover:underline"
            >
              {displayUrl(settings.public_url)}
            </a>
            {settings.instagram_handle && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Instagram className="h-4 w-4" />
                @{settings.instagram_handle}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={settings.public_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir
            </a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">El logo y el Instagram los gestiona AgendyFix.</p>
      </CardContent>
    </Card>
  );
}
