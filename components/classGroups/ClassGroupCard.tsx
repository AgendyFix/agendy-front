"use client";

// ============================================
// CLASS GROUP CARD - Tarjeta de grupo/clase
// ============================================

import { Pencil, Trash2, Clock, Users, GraduationCap, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ClassGroup } from "@/lib/types/models";

const LEVEL_COLORS: Record<string, string> = {
  all:          "bg-gray-100 text-gray-700",
  beginner:     "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced:     "bg-red-100 text-red-700",
};

interface ClassGroupCardProps {
  group: ClassGroup;
  onDelete: (id: string, name: string) => void;
}

export function ClassGroupCard({ group, onDelete }: ClassGroupCardProps) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={() => router.push(`/class-groups/${group.id}`)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base truncate">{group.name}</h3>
              {group.is_individual ? (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                  Individual
                </span>
              ) : (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[group.level] ?? LEVEL_COLORS.all}`}
                >
                  {group.level_display}
                </span>
              )}
            </div>
            {group.instructor_name && (
              <p className="text-sm text-muted-foreground mt-0.5">
                Instructor: {group.instructor_name}
              </p>
            )}
          </div>

          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/class-groups/${group.id}?edit=true`);
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
                onDelete(group.id, group.name);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>

        {/* Disciplinas */}
        {group.disciplines && group.disciplines.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {group.disciplines.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
              >
                {d.name}
              </span>
            ))}
          </div>
        )}

        {/* Horario */}
        {group.schedule_display && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{group.schedule_display}</span>
          </div>
        )}

        {/* Footer: alumnos + mensualidad */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1.5 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{group.active_enrollment_count}</span>
            <span className="text-muted-foreground">
              alumno{group.active_enrollment_count !== 1 ? "s" : ""}
            </span>
          </div>
          {(() => {
            const fee = group.is_individual
              ? (group.primary_enrollment_fee ?? null)
              : group.monthly_fee;
            return fee != null ? (
              <div className="flex items-center gap-1 text-sm font-semibold text-green-700">
                <DollarSign className="h-4 w-4" />
                <span>${fee.toLocaleString("es-MX")}/mes</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground italic">Sin tarifa fija</span>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
