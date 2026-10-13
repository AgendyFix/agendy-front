"use client";

// ============================================
// MI SITIO - Edición de datos de la página de la academia (solo admin)
// ============================================

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsAdmin } from "@/lib/hooks/useIsAdmin";
import { parseFieldErrors } from "@/lib/apiError";
import { PricesEditor } from "@/components/publicPage/PricesEditor";
import { PaymentMethodsToggle } from "@/components/publicPage/PaymentMethodsToggle";
import { PromotionsEditor } from "@/components/publicPage/PromotionsEditor";
import { AccentColorCard } from "@/components/publicPage/AccentColorCard";
import { PublicLinkCard } from "@/components/publicPage/PublicLinkCard";
import { publicPageApi } from "@/lib/api/publicPage";
import type { PublicPageSettings, PublicPageUpdate } from "@/lib/types/models";

const EMPTY_FORM: PublicPageUpdate = {
  public_description: "",
  public_address: "",
  public_maps_url: "",
  public_whatsapp: "",
  public_prices: [],
  public_payment_methods: [],
  public_promotions: [],
  public_accent_color_custom: "",
};

const FIELD_LABELS: Record<string, string> = {
  public_description: "Descripción",
  public_address: "Dirección",
  public_maps_url: "Link de Google Maps",
  public_whatsapp: "WhatsApp",
  public_prices: "Precios",
  public_payment_methods: "Métodos de pago",
  public_promotions: "Promociones",
  public_accent_color_custom: "Color de tu sitio",
};

export default function PublicPagePage() {
  const [settings, setSettings] = useState<PublicPageSettings | null>(null);
  const [form, setForm] = useState<PublicPageUpdate>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!isAdmin) {
      setIsLoading(false);
      return;
    }
    publicPageApi
      .get()
      .then((data) => {
        setSettings(data);
        setForm({
          public_description: data.public_description ?? "",
          public_address: data.public_address ?? "",
          public_maps_url: data.public_maps_url ?? "",
          public_whatsapp: data.public_whatsapp ?? "",
          public_prices: data.public_prices ?? [],
          public_payment_methods: data.public_payment_methods ?? [],
          public_promotions: data.public_promotions ?? [],
          public_accent_color_custom: data.public_accent_color_custom ?? "",
        });
      })
      .catch(() => toast.error("No se pudo cargar la información de tu página"))
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  const setField = <K extends keyof PublicPageUpdate>(field: K, value: PublicPageUpdate[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setErrors({});
      const data = await publicPageApi.update(form);
      setSettings(data);
      toast.success("Cambios guardados");
    } catch (error) {
      const { fieldErrors } = parseFieldErrors(error);
      setErrors(fieldErrors);
      const [firstField, firstError] = Object.entries(fieldErrors)[0] ?? [];
      toast.error(
        firstError
          ? `${FIELD_LABELS[firstField] ?? firstField}: ${firstError}`
          : "No se pudieron guardar los cambios"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) {
    return <p className="text-muted-foreground">Solo los administradores pueden editar Mi Sitio.</p>;
  }

  if (!settings) {
    return <p className="text-muted-foreground">No se pudo cargar la información de tu página.</p>;
  }

  const fieldError = (field: string) =>
    errors[field] ? <p className="text-xs text-destructive">{errors[field]}</p> : null;

  return (
    <form onSubmit={handleSave} className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Sitio</h1>
          <p className="text-muted-foreground">
            Lo que tus alumnos nuevos ven al abrir el link de tu academia.
          </p>
        </div>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          <PublicLinkCard settings={settings} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contenido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="public_description">Descripción</Label>
                <Textarea
                  id="public_description"
                  rows={5}
                  value={form.public_description}
                  onChange={(e) => setField("public_description", e.target.value)}
                />
                {fieldError("public_description")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="public_address">Dirección</Label>
                <Input
                  id="public_address"
                  value={form.public_address}
                  onChange={(e) => setField("public_address", e.target.value)}
                />
                {fieldError("public_address")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="public_maps_url">Link de Google Maps</Label>
                <Input
                  id="public_maps_url"
                  type="url"
                  value={form.public_maps_url}
                  onChange={(e) => setField("public_maps_url", e.target.value)}
                  placeholder="https://maps.app.goo.gl/…"
                />
                <p className="text-xs text-muted-foreground">
                  En Google Maps busca tu academia → Compartir → Copiar vínculo. Se usa en el botón
                  &quot;Cómo llegar&quot;; el mapa de tu sitio se arma con la dirección.
                </p>
                {fieldError("public_maps_url")}
              </div>
              <div className="space-y-2">
                <Label htmlFor="public_whatsapp">WhatsApp</Label>
                <Input
                  id="public_whatsapp"
                  inputMode="tel"
                  value={form.public_whatsapp}
                  onChange={(e) => setField("public_whatsapp", e.target.value)}
                  placeholder="10 dígitos"
                />
                <p className="text-xs text-muted-foreground">
                  Si lo dejas vacío, no aparece el botón de WhatsApp en tu sitio
                </p>
                {fieldError("public_whatsapp")}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <AccentColorCard
            baseColor={settings.public_accent_color}
            value={form.public_accent_color_custom}
            onChange={(v) => setField("public_accent_color_custom", v)}
          />
          {fieldError("public_accent_color_custom")}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Precios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <PricesEditor value={form.public_prices} onChange={(v) => setField("public_prices", v)} />
              {fieldError("public_prices")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Métodos de pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <PaymentMethodsToggle
                value={form.public_payment_methods}
                onChange={(v) => setField("public_payment_methods", v)}
              />
              {fieldError("public_payment_methods")}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Promociones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <PromotionsEditor
                value={form.public_promotions}
                onChange={(v) => setField("public_promotions", v)}
              />
              {fieldError("public_promotions")}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
