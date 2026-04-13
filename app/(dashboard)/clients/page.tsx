"use client";

// ============================================
// CLIENTS PAGE
// ============================================

import { useFeatures } from "@/lib/hooks/useFeatures";
import { useAuth } from "@/lib/hooks/useAuth";
import { ClientsList } from "@/components/clients/ClientsList";

export default function ClientsPage() {
  const { getFeatureName } = useFeatures();
  const { currentCompany } = useAuth();

  // Nombre dinámico desde el feature flag (ej: "Alumnos") o fallback "Clientes"
  const entityName = getFeatureName("client_groups") ?? "Clientes";
  const companyName = currentCompany?.name ?? "tu empresa";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{entityName}</h1>
        <p className="text-muted-foreground">
          Gestiona los {entityName.toLowerCase()} de {companyName}
        </p>
      </div>

      <ClientsList entityName={entityName} />
    </div>
  );
}
