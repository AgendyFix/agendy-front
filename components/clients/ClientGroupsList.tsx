"use client";

// ============================================
// CLIENT GROUPS LIST - Lista de grupos (tab)
// ============================================

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { useClientGroups } from "@/lib/hooks/useClientGroups";
import { ClientGroupCard } from "./ClientGroupCard";

export function ClientGroupsList() {
  const router = useRouter();
  const {
    groups,
    isLoading,
    totalCount,
    currentPage,
    hasNext,
    hasPrevious,
    fetchGroups,
  } = useClientGroups();
  const [searchTerm, setSearchTerm] = useState("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchGroups({ page: 1 });
      hasFetched.current = true;
    }
  }, []);

  const handlePageChange = (page: number) => {
    fetchGroups({ 
      page, 
      search: searchTerm || undefined 
    });
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchGroups({ 
      page: 1, 
      search: value || undefined 
    });
  };

  const filteredGroups = Array.isArray(groups) ? groups : [];
  const totalPages = Math.ceil(totalCount / 10);

  if (isLoading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando grupos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <CardDescription>
            {totalCount > 0
              ? `${totalCount} grupo${totalCount !== 1 ? "s" : ""} creado${totalCount !== 1 ? "s" : ""}`
              : "No hay grupos creados"
            }
          </CardDescription>
        </div>
        <Button onClick={() => router.push("/clients/groups/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Grupo
        </Button>
      </div>

      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm
                  ? "No se encontraron grupos"
                  : "No hay grupos creados"}
              </p>
              {!searchTerm && (
                <Button
                  onClick={() => router.push("/clients/groups/new")}
                  className="mt-4"
                  variant="outline"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Crear primer grupo
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <ClientGroupCard
                  key={group.id}
                  group={group}
                  onClick={(id) => router.push(`/clients/groups/${id}`)}
                />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPrevious || isLoading}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNext || isLoading}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}