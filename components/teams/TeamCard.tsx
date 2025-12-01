// ============================================
// TEAM CARD - Mobile view for teams
// ============================================

import { Pencil, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Team } from "@/lib/types/models";

interface TeamCardProps {
  team: Team;
  onDelete: (id: string, name: string) => void;
}

export function TeamCard({ team, onDelete }: TeamCardProps) {
  const router = useRouter();

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={() => router.push(`/teams/${team.id}`)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {team.name}
              </h3>
              {team.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {team.description}
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
                  router.push(`/teams/${team.id}`);
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
                  onDelete(team.id, team.name);
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          </div>

          {/* Miembros */}
          <div className="pt-2 border-t">
            {team.employee_count > 0 ? (
              <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs font-medium">
                {team.employee_count} miembro{team.employee_count !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-muted-foreground italic text-sm">Sin miembros</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}