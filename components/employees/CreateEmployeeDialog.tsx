// ============================================
// CREATE EMPLOYEE DIALOG
// ============================================

"use client";

import { useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { employeesApi } from "@/lib/api/employees";
import type { Employee } from "@/lib/types/models";

interface CreateEmployeeDialogProps {
  onCreated: (employee: Employee) => void;
}

export function CreateEmployeeDialog({ onCreated }: CreateEmployeeDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");
  const [specialty, setSpecialty] = useState("");

  const reset = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSpecialty("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Nombre y apellido son requeridos");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      toast.error("Se requiere al menos email o teléfono");
      return;
    }

    try {
      setSaving(true);
      const created = await employeesApi.create({
        first_name: firstName.trim(),
        last_name:  lastName.trim(),
        email:      email.trim() || undefined,
        phone:      phone.trim() || undefined,
        specialty:  specialty.trim() || undefined,
      });
      toast.success("Instructor creado correctamente");
      onCreated(created);
      setOpen(false);
      reset();
    } catch (err: unknown) {
      // Intentar mostrar error del API
      const anyErr = err as { response?: { data?: Record<string, string[]> } };
      const data = anyErr?.response?.data;
      if (data) {
        const msg =
          data.non_field_errors?.[0] ||
          data.email?.[0] ||
          data.phone?.[0] ||
          "Error al crear el instructor";
        toast.error(msg);
      } else {
        toast.error("Error al crear el instructor");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo instructor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Agregar instructor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="emp-first-name">Nombre <span className="text-destructive">*</span></Label>
              <Input
                id="emp-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Carlos"
                disabled={saving}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emp-last-name">Apellido <span className="text-destructive">*</span></Label>
              <Input
                id="emp-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="López"
                disabled={saving}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp-email">Email</Label>
            <Input
              id="emp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="carlos@academia.com"
              disabled={saving}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="emp-phone">Teléfono</Label>
            <Input
              id="emp-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9991234567"
              disabled={saving}
            />
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Se requiere al menos email o teléfono.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="emp-specialty">Especialidad</Label>
            <Input
              id="emp-specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="Ej: Salsa y Bachata"
              disabled={saving}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={saving} className="flex-1">
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear instructor
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setOpen(false); reset(); }}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
