"use client";

// ============================================
// NEW ENROLLMENT PAGE - Inscribir alumno
// ============================================

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, ChevronsUpDown, Check, Clock, DollarSign } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useEnrollments } from "@/lib/hooks/useEnrollments";
import { clientsApi } from "@/lib/api/clients";
import { classGroupsApi } from "@/lib/api/classGroups";
import type { Client, ClassGroup } from "@/lib/types/models";

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  client: z.string().min(1, "Selecciona un alumno"),
  class_group: z.string().min(1, "Selecciona un grupo"),
  start_date: z.string().min(1, "Selecciona la fecha de inicio"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function NewEnrollmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedGroupId = searchParams.get("class_group") ?? "";
  const preselectedClientId = searchParams.get("client") ?? "";

  const { createEnrollment, isLoading } = useEnrollments();

  const [clients, setClients] = useState<Client[]>([]);
  const [groups, setGroups] = useState<ClassGroup[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [preselectedGroup, setPreselectedGroup] = useState<ClassGroup | null>(null);
  const [preselectedClient, setPreselectedClient] = useState<Client | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client: preselectedClientId,
      class_group: preselectedGroupId,
      start_date: new Date().toISOString().slice(0, 10),
      notes: "",
    },
  });

  const selectedClientId = form.watch("client");
  const selectedGroupId = form.watch("class_group");
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? preselectedClient;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? preselectedGroup;

  // Cargar grupos
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingGroups(true);
        const response = await classGroupsApi.getAll({ limit: 100 });
        setGroups(response.results);
        if (preselectedGroupId) {
          const found = response.results.find((g) => g.id === preselectedGroupId);
          if (found) setPreselectedGroup(found);
        }
      } catch {
        toast.error("No se pudieron cargar los grupos");
      } finally {
        setLoadingGroups(false);
      }
    };
    load();
  }, [preselectedGroupId]);

  // Cargar clientes iniciales y cuando se abre el combobox
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingClients(true);
        const response = await clientsApi.getAll({ limit: 100 });
        setClients(response.results);
        if (preselectedClientId) {
          const found = response.results.find((c) => c.id === preselectedClientId);
          if (found) setPreselectedClient(found);
        }
      } catch {
        // no bloqueante
      } finally {
        setLoadingClients(false);
      }
    };
    load();
  }, [preselectedClientId]);

  const handleSubmit = async (values: FormValues) => {
    try {
      await createEnrollment({
        client: values.client,
        class_group: values.class_group,
        start_date: values.start_date,
        notes: values.notes || undefined,
      });
      toast.success("Alumno inscrito exitosamente");
      if (preselectedClientId) {
        router.push(`/clients/${preselectedClientId}`);
      } else if (preselectedGroupId) {
        router.push(`/class-groups/${preselectedGroupId}`);
      } else {
        router.push("/clients");
      }
    } catch (err: any) {
      const apiErrors = err?.response?.data;
      if (apiErrors && typeof apiErrors === "object") {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : String(messages);
          toast.error(`${field}: ${msg}`);
        });
      } else {
        toast.error("Error al inscribir al alumno");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inscribir alumno</h1>
          <p className="text-muted-foreground text-sm">
            {preselectedGroup
              ? `Grupo: ${preselectedGroup.name}`
              : preselectedClient
              ? `Alumno: ${preselectedClient.full_name}`
              : "Selecciona el alumno y el grupo"}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos de la inscripción</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

              {/* ── Selector de alumno (Combobox) ── */}
              <FormField
                control={form.control}
                name="client"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Alumno *</FormLabel>
                    <Popover open={clientOpen} onOpenChange={setClientOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={loadingClients || !!preselectedClientId}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {loadingClients ? (
                              <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Cargando...
                              </span>
                            ) : selectedClient ? (
                              <span className="flex items-center gap-2">
                                <span className="font-medium">{selectedClient.full_name}</span>
                                {selectedClient.phone && (
                                  <span className="text-muted-foreground text-xs">
                                    {selectedClient.phone}
                                  </span>
                                )}
                              </span>
                            ) : (
                              "Buscar alumno..."
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar por nombre o teléfono..." />
                          <CommandList>
                            <CommandEmpty>Sin resultados</CommandEmpty>
                            <CommandGroup>
                              {clients.map((c) => (
                                <CommandItem
                                  key={c.id}
                                  value={`${c.full_name} ${c.phone ?? ""}`}
                                  onSelect={() => {
                                    field.onChange(c.id);
                                    setClientOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === c.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-medium">{c.full_name}</span>
                                    {c.phone && (
                                      <span className="text-xs text-muted-foreground">{c.phone}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Selector de grupo ── */}
              <FormField
                control={form.control}
                name="class_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grupo / Clase *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingGroups || !!preselectedGroupId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {loadingGroups ? (
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Cargando grupos...
                            </span>
                          ) : (
                            <SelectValue placeholder="Seleccionar grupo" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>
                            <div className="flex flex-col">
                              <span>{g.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {g.level_display} · ${g.monthly_fee.toLocaleString("es-MX")}/mes
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Info del grupo seleccionado ── */}
              {selectedGroup && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                  <p className="font-medium text-sm">{selectedGroup.name}</p>
                  {selectedGroup.schedule_display && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{selectedGroup.schedule_display}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>${selectedGroup.monthly_fee.toLocaleString("es-MX")}/mes</span>
                  </div>
                </div>
              )}

              {/* ── Fecha de inicio ── */}
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio *</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="dd/mm/yyyy"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Notas ── */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas internas</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Viene referida por otra alumna..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ── Acciones ── */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Inscribir alumno
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
