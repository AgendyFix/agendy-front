// ============================================
// CLIENT CARD - Mobile view for clients
// ============================================

import { Pencil, Trash2, Phone, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Client } from "@/lib/types/models";

interface ClientCardProps {
  client: Client;
  onDelete: (id: string, name: string) => void;
}

export function ClientCard({ client, onDelete }: ClientCardProps) {
  const router = useRouter();

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-base">{client.full_name}</h3>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/clients/${client.id}`);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(client.id, client.full_name);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-2 text-sm">
            {client.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span>{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{client.phone}</span>
              </div>
            )}
            {!client.email && !client.phone && (
              <span className="text-muted-foreground italic text-sm">Sin contacto</span>
            )}
          </div>

          {/* Total citas */}
          <div className="pt-2 border-t">
            {client.total_appointments > 0 ? (
              <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-1 text-xs font-medium">
                {client.total_appointments} cita{client.total_appointments !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-muted-foreground italic text-sm">Sin citas</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}