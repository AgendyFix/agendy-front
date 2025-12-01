// ============================================
// SERVICE CARD - Mobile view for services
// ============================================

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Service } from "@/lib/types/models";

interface ServiceCardProps {
  service: Service;
  onDelete: (id: string, name: string) => void;
}

export function ServiceCard({ service, onDelete }: ServiceCardProps) {
  const router = useRouter();

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={() => router.push(`/services/${service.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-base">{service.name}</h3>
              {service.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {service.description}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/services/${service.id}`);
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
                  onDelete(service.id, service.name);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Precio:</span>
              <p className="font-medium">
                {service.price ? `$${service.price}` : (
                  <span className="italic text-muted-foreground">A consultar</span>
                )}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Duración:</span>
              <p className="font-medium">
                {service.duration_minutes ? `${service.duration_minutes} min` : (
                  <span className="italic text-muted-foreground">Variable</span>
                )}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Reservas Online:</span>
              <p className="font-medium">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  service.is_bookable_online
                    ? "bg-blue-50 text-blue-700"
                    : "bg-gray-50 text-gray-700"
                }`}>
                  {service.is_bookable_online ? "Sí" : "No"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}