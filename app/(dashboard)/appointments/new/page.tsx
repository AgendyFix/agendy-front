"use client";

// ============================================
// NEW APPOINTMENT PAGE - Crear nueva cita
// ============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppointments } from "@/lib/hooks/useAppointments";
import { clientsApi } from "@/lib/api/clients";
import { servicesApi } from "@/lib/api/services";
import type { Client, Service, Employee } from "@/lib/types/models";
import type { CreateAppointmentRequest } from "@/lib/types/api";
import { employeesApi } from "@/lib/api/employees";

const appointmentSchema = z.object({
  client: z.string().min(1, "El cliente es requerido"),
  service: z.string().optional(),
  custom_service_description: z.string().optional(),
  start_at: z.string().min(1, "La fecha y hora son requeridas"),
  title: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  estimated_price: z.string().optional(),
  client_notes: z.string().optional(),
  assigned_to: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

export default function NewAppointmentPage() {
  const router = useRouter();
  const { createAppointment, isLoading } = useAppointments();
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingData(true);
        // Cargar clients, services y employees
        const clientsRes = await clientsApi.getAll({ limit: 100, offset: 0 });
        const servicesRes = await servicesApi.getAll({});
        const employeesRes = await employeesApi.getAll({ limit: 100, offset: 0 });
        
        setClients(clientsRes.results);
        setServices(servicesRes.results);
        setEmployees(employeesRes.results);
      } catch (error) {
        toast.error("Error al cargar datos");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      const cleanData: Partial<CreateAppointmentRequest> = {
        client: data.client,
        start_at: data.start_at,
      };
      
      if (data.title?.trim()) cleanData.title = data.title.trim();
      if (data.description?.trim()) cleanData.description = data.description.trim();
      if (data.service) cleanData.service = data.service;
      if (data.custom_service_description?.trim()) {
        cleanData.custom_service_description = data.custom_service_description.trim();
      }
      if (data.location?.trim()) cleanData.location = data.location.trim();
      if (data.estimated_price?.trim()) cleanData.estimated_price = data.estimated_price.trim();
      if (data.client_notes?.trim()) cleanData.client_notes = data.client_notes.trim();
      if (data.assigned_to) cleanData.assigned_to = data.assigned_to;
      
      await createAppointment(cleanData as CreateAppointmentRequest);
      toast.success("Cita creada exitosamente");
      router.push("/appointments");
    } catch (error) {
      toast.error("Error al crear la cita");
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Cita</h1>
          <p className="text-muted-foreground">
            Programa una nueva cita para un cliente
          </p>
        </div>
      </div>

      <Card className="max-w-2xl shadow-card">
        <CardHeader>
          <CardTitle>Información de la Cita</CardTitle>
          <CardDescription>
            Completa los datos de la cita
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client">
                Cliente <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="client"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                   <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.client && (
                <p className="text-sm text-red-500">{errors.client.message}</p>
              )}
            </div>

            {/* Servicio */}
            <div className="space-y-2">
              <Label htmlFor="service">Servicio (opcional)</Label>
              <Controller
                name="service"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin servicio predefinido" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} {service.price ? `- $${service.price}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Descripción personalizada si no hay servicio */}
            <div className="space-y-2">
              <Label htmlFor="custom_service_description">
                Descripción del servicio (si no seleccionaste uno)
              </Label>
              < Input
                id="custom_service_description"
                placeholder="Ej: Consulta general"
                disabled={isLoading}
                {...register("custom_service_description")}
              />
            </div>

            {/* Fecha y hora */}
            <div className="space-y-2">
              <Label htmlFor="start_at">
                Fecha y Hora <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_at"
                type="datetime-local"
                disabled={isLoading}
                {...register("start_at")}
              />
              {errors.start_at && (
                <p className="text-sm text-red-500">{errors.start_at.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                La hora de fin se calcula automáticamente según el servicio
              </p>
            </div>

            {/* Título y Descripción */}
            <div className="space-y-2">
              <Label htmlFor="title">Título (opcional)</Label>
              <Input
                id="title"
                placeholder="Ej: Cita con María González"
                disabled={isLoading}
                {...register("title")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Detalles adicionales de la cita..."
                disabled={isLoading}
                rows={2}
                {...register("description")}
              />
            </div>

            {/* Ubicación y Precio */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación (opcional)</Label>
                <Input
                  id="location"
                  placeholder="Dirección o sucursal"
                  disabled={isLoading}
                  {...register("location")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_price">Precio Estimado (opcional)</Label>
                <Input
                  id="estimated_price"
                  type="text"
                  inputMode="numeric"
                  placeholder="0.00"
                  disabled={isLoading}
                  {...register("estimated_price")}
                />
                <p className="text-xs text-muted-foreground">
                modificar solo si el precio es diferente al asignado por el servicio.
              </p>
              </div>
            </div>

            {/* Asignar A */}
            <div className="space-y-2">
              <Label htmlFor="assigned_to">Asignar a Empleado (opcional)</Label>
              <Controller
                name="assigned_to"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.full_name} - {employee.role === "admin" ? "Admin" : "Operador"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">
                Empleado responsable de esta cita
              </p>
            </div>

            {/* Notas del Cliente */}
            <div className="space-y-2">
              <Label htmlFor="client_notes">Notas del Cliente (opcional)</Label>
              <Textarea
                id="client_notes"
                placeholder="Preferencias o solicitudes especiales del cliente..."
                disabled={isLoading}
                rows={3}
                {...register("client_notes")}
              />
              <p className="text-xs text-muted-foreground">
                Visibles para el cliente. Usa Enter para saltos de línea.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={isLoading || loadingData}
                className="flex-1"
              >
                {isLoading ? "Creando..." : "Crear Cita"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}