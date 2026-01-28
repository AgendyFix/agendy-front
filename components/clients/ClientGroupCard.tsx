"use client";

// ============================================
// CLIENT GROUP CARD - Tarjeta de grupo
// ============================================

import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientGroup } from "@/lib/types/models";

interface ClientGroupCardProps {
  group: ClientGroup;
  onClick: (id: string) => void;
}

export function ClientGroupCard({ group, onClick }: ClientGroupCardProps) {
  return (
    <Card
      className="shadow-card hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onClick(group.id)}
    >
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <CardDescription className="mt-1">
              {group.member_count} {group.member_count === 1 ? "cliente" : "clientes"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      {group.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {group.description}
          </p>
        </CardContent>
      )}
    </Card>
  );
}