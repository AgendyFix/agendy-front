// ============================================
// EMPLOYEE CARD - Mobile view for employees
// ============================================

import { Pencil, User } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Employee } from "@/lib/types/models";

interface EmployeeCardProps {
  employee: Employee;
  isAdmin: boolean;
}

export function EmployeeCard({ employee, isAdmin }: EmployeeCardProps) {
  const router = useRouter();

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all"
      onClick={() => isAdmin ? router.push(`/employees/${employee.id}`) : undefined}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {employee.full_name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{employee.email}</p>
            </div>
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/employees/${employee.id}`);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Rol y Equipos */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                employee.role === "admin"
                  ? "bg-purple-50 text-purple-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {employee.role === "admin" ? "Administrador" : "Operador"}
            </span>
            
            {employee.teams_count > 0 ? (
              <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2 py-1 text-xs font-medium">
                {employee.teams_count} equipo{employee.teams_count !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-muted-foreground italic text-sm">Sin equipos</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}