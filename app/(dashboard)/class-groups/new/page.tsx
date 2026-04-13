"use client";

// ============================================
// NEW CLASS GROUP PAGE - Crear grupo
// ============================================

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClassGroupForm } from "@/components/classGroups/ClassGroupForm";
import { useClassGroups } from "@/lib/hooks/useClassGroups";
import type { CreateClassGroupRequest } from "@/lib/types/api";

export default function NewClassGroupPage() {
  const router = useRouter();
  const { createClassGroup, isLoading } = useClassGroups();

  const handleSubmit = async (data: CreateClassGroupRequest) => {
    const newGroup = await createClassGroup(data);
    toast.success("Grupo creado exitosamente");
    router.push(`/class-groups/${newGroup.id}`);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nuevo grupo</h1>
          <p className="text-muted-foreground text-sm">
            Crea un grupo con sus horarios y mensualidad
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del grupo</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassGroupForm
            onSubmit={handleSubmit}
            onCancel={() => router.back()}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
