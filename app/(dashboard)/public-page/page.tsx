"use client";

// ============================================
// MI PÁGINA PÚBLICA - Edición de datos de la página de la academia (solo admin)
// ============================================

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/hooks/useAuth";
import { PublicLinkCard } from "@/components/publicPage/PublicLinkCard";
import { publicPageApi } from "@/lib/api/publicPage";
import type { PublicPageSettings, PublicPageUpdate } from "@/lib/types/models";

const EMPTY_FORM: PublicPageUpdate = {
  public_tagline: "",
  public_description: "",
  public_address: "",
  public_whatsapp: "",
  public_prices_text: "",
};

export default function PublicPagePage() {
  const { user, currentCompany } = useAuth();
  const [settings, setSettings] = useState<PublicPageSettings | null>(null);
  const [form, setForm] = useState<PublicPageUpdate>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const currentRole = user?.employee_profiles?.find(
    (profile) => profile.company === currentCompany?.id
  )?.role;
  const isAdmin = currentRole === "admin";

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
          public_tagline: data.public_tagline ?? "",
          public_description: data.public_description ?? "",
          public_address: data.public_address ?? "",
          public_whatsapp: data.public_whatsapp ?? "",
          public_prices_text: data.public_prices_text ?? "",
        });
      })
      .catch(() => toast.error("No se pudo cargar la información de tu página"))
      .finally(() => setIsLoading(false));
  }, [isAdmin]);

  const setField = (field: keyof PublicPageUpdate, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const data = await publicPageApi.update(form);
      setSettings(data);
      toast.success("Cambios guardados");
    } catch {
      toast.error("No se pudieron guardar los cambios");
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
    return <p className="text-muted-foreground">Solo los administradores pueden editar la página pública.</p>;
  }

  if (!settings) {
    return <p className="text-muted-foreground">No se pudo cargar la información de tu página.</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mi página pública</h1>
        <p className="text-sm text-muted-foreground">
          Lo que tus alumnos nuevos ven al abrir el link de tu academia.
        </p>
      </div>

      <PublicLinkCard settings={settings} />

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contenido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="public_tagline">Frase corta</Label>
              <Input
                id="public_tagline"
                value={form.public_tagline}
                onChange={(e) => setField("public_tagline", e.target.value)}
                placeholder="Ej. Grupo de entrenamiento para bailarines principiantes"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public_description">Descripción</Label>
              <Textarea
                id="public_description"
                rows={5}
                value={form.public_description}
                onChange={(e) => setField("public_description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="public_address">Dirección</Label>
              <Input
                id="public_address"
                value={form.public_address}
                onChange={(e) => setField("public_address", e.target.value)}
              />
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="public_prices_text">Precios</Label>
              <Textarea
                id="public_prices_text"
                rows={6}
                value={form.public_prices_text}
                onChange={(e) => setField("public_prices_text", e.target.value)}
                placeholder={"Clase suelta $130\nUna disciplina $450"}
              />
              <p className="text-xs text-muted-foreground">Un precio por línea.</p>
            </div>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
