"use client";

// ============================================
// DASHBOARD HOME PAGE
// ============================================

import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { user, currentCompany } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Bienvenido, {user?.first_name}!
        </h1>
        <p className="text-muted-foreground">
          Panel de administración de {currentCompany?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Citas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Próximamente
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Próximamente
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Servicios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Próximamente
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Equipos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Próximamente
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Estado del Sistema</CardTitle>
          <CardDescription>
            Módulo de autenticación implementado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Autenticación JWT</span>
              <span className="text-xs text-green-600">Activo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">✅ Gestión de Companies</span>
              <span className="text-xs text-green-600">Activo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">⏳ Módulo de Servicios</span>
              <span className="text-xs text-gray-500">Pendiente</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">⏳ Módulo de Clientes</span>
              <span className="text-xs text-gray-500">Pendiente</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">⏳ Módulo de Citas</span>
              <span className="text-xs text-gray-500">Pendiente</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}