"use client";

// ============================================
// DASHBOARD HOME PAGE
// ============================================

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/hooks/useAuth";
import { metabaseApi } from "@/lib/api/metabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// agrega/quita theme=night en el #hash del iframe para activar modo osucro en metabase dashboards
function applyMetabaseTheme(urlStr: string, theme: "light" | "dark") {
  const url = new URL(urlStr);
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));

  if (theme === "dark") hashParams.set("theme", "night");
  else hashParams.delete("theme"); // vuelve a claro/default

  url.hash = hashParams.toString();
  return url.toString();
}

export default function DashboardPage() {
  const { user, currentCompany } = useAuth();
  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // ESTADO NUEVO: theme actual
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // detecta cambios del modo oscuro mirando la clase "dark" del <html>
  useEffect(() => {
    const updateThemeFromDom = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    };

    updateThemeFromDom(); // inicial

    const obs = new MutationObserver(updateThemeFromDom);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const loadMetabaseDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await metabaseApi.getDashboard({
          dashboard_id: "2",
          date_filter: "thisyear",
        });
        setIframeUrl(data.iframe_url);
      } catch (error) {
        console.error("Error loading Metabase:", error);
        toast.error("Error al cargar dashboard de métricas");
      } finally {
        setIsLoading(false);
      }
    };

    if (user && currentCompany) {
      loadMetabaseDashboard();
    }
  }, [user, currentCompany]);

  // calcula URL final con dark/light aplicado
  const themedIframeUrl = iframeUrl ? applyMetabaseTheme(iframeUrl, theme) : "";

  return (
    <div className="h-full flex flex-col">
      {/* Metabase Dashboard - Pantalla Completa */}
      <Card className="shadow-card flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dashboard de {currentCompany?.name}</CardTitle>
              <CardDescription className="mt-1">
                Métricas y análisis en tiempo real
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground">
              Datos del año actual
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando dashboard...</p>
              </div>
            </div>
          ) : themedIframeUrl ? (
            <div className="w-full h-full min-h-[700px]">
              <iframe
                //key para forzar recarga al cambiar theme
                key={`${theme}-${iframeUrl}`}
                src={themedIframeUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                className="rounded-lg"
                title="Metabase Dashboard"
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No se pudo cargar el dashboard de métricas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}