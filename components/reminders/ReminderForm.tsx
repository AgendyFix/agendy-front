"use client";

// ============================================
// REMINDER FORM - Formulario de creación/edición de reminder
// Con soporte para WhatsApp Templates
// ============================================

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useClients } from "@/lib/hooks/useClients";
import { useClientGroups } from "@/lib/hooks/useClientGroups";
import { useTemplates, useTemplatePreview } from "@/lib/hooks/useTemplates";
import { templatesApi } from "@/lib/api/templates";
import type { WhatsAppTemplate } from "@/lib/types/models";
import type { CreateReminderRequest } from "@/lib/types/api";
import type { ReminderChannel, ReminderType, ReminderRecurrence } from "@/lib/types/models";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WEEKDAYS = {
  0: 'Lunes',
  1: 'Martes',
  2: 'Miércoles',
  3: 'Jueves',
  4: 'Viernes',
  5: 'Sábado',
  6: 'Domingo'
} as const;

// Schema de validación
const reminderSchema = z.object({
  targetType: z.enum(["individual", "group"]),
  channel: z.enum(["whatsapp", "email", "sms"]),
  reminderType: z.enum(["appointment", "custom", "promotional", "follow_up"]),
  client: z.string().optional(),
  clientGroup: z.string().optional(),
  
  // Modo: template o mensaje personalizado
  messageMode: z.enum(["template", "custom"]),
  template: z.string().optional(),
  templateVariables: z.record(z.string(), z.string()).optional(),
  message: z.string().optional(),
  
  scheduledDate: z.date({ message: "La fecha es requerida" }),
  scheduledTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  recurrence: z.enum(["once", "daily", "weekly", "monthly"]),
  recurrenceWeekday: z.number().min(0).max(6).optional(),
  recurrenceEndDate: z.date().optional(),
}).refine((data) => {
  // Validar que se seleccione cliente o grupo según targetType
  if (data.targetType === "individual" && !data.client) {
    return false;
  }
  if (data.targetType === "group" && !data.clientGroup) {
    return false;
  }
  return true;
}, {
  message: "Debes seleccionar un destinatario",
  path: ["client"],
}).refine((data) => {
  // Validar que recurrencia semanal tenga día
  if (data.recurrence === "weekly" && data.recurrenceWeekday === undefined) {
    return false;
  }
  return true;
}, {
  message: "Debes seleccionar un día de la semana",
  path: ["recurrenceWeekday"],
}).refine((data) => {
  // Validar mensaje según modo
  if (data.messageMode === "custom" && !data.message) {
    return false;
  }
  if (data.messageMode === "template" && !data.template) {
    return false;
  }
  return true;
}, {
  message: "Debes proporcionar un mensaje o seleccionar un template",
  path: ["message"],
});

type ReminderFormData = z.infer<typeof reminderSchema>;

interface ReminderFormProps {
  onSubmit: (data: CreateReminderRequest) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<ReminderFormData>;
}

export function ReminderForm({ onSubmit, onCancel, initialData }: ReminderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [selectedTemplateDetail, setSelectedTemplateDetail] = useState<WhatsAppTemplate | null>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  
  const { clients, fetchClients } = useClients();
  const { groups, fetchGroups } = useClientGroups();
  const { templates, fetchTemplates } = useTemplates();
  const { preview, isLoading: isPreviewLoading, generatePreview } = useTemplatePreview();

  const form = useForm<ReminderFormData>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      targetType: "individual",
      channel: "whatsapp",
      reminderType: "custom",
      messageMode: "template",
      recurrence: "once",
      scheduledTime: "09:00",
      templateVariables: {},
      ...initialData,
    },
  });

  const targetType = form.watch("targetType");
  const messageMode = form.watch("messageMode");
  const selectedTemplateId = form.watch("template");
  const recurrence = form.watch("recurrence");

  // Cargar datos al montar
  useEffect(() => {
    fetchClients();
    fetchGroups();
    fetchTemplates({ status: 'approved' }); // Solo templates aprobados
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando se selecciona un template, cargar su detalle
  useEffect(() => {
    const loadTemplateDetail = async () => {
      if (selectedTemplateId) {
        try {
          setIsLoadingTemplate(true);
          const templateDetail = await templatesApi.getById(selectedTemplateId);
          setSelectedTemplateDetail(templateDetail);
          
          // Inicializar variables vacías
          if (templateDetail.variables_metadata) {
            const emptyVars: Record<string, string> = {};
            Object.keys(templateDetail.variables_metadata).forEach(key => {
              emptyVars[key] = '';
            });
            setTemplateVars(emptyVars);
            form.setValue('templateVariables', emptyVars);
          }
        } catch (error) {
          console.error("Error loading template detail:", error);
          toast.error("Error al cargar el template");
        } finally {
          setIsLoadingTemplate(false);
        }
      } else {
        setSelectedTemplateDetail(null);
        setTemplateVars({});
      }
    };

    loadTemplateDetail();
  }, [selectedTemplateId, form]);

  const selectedTemplate = selectedTemplateDetail;

  const handlePreview = async () => {
    if (!selectedTemplateId || !selectedTemplate) {
      toast.error("Selecciona un template primero");
      return;
    }

    // Validar que todas las variables estén llenas
    const allFilled = Object.keys(selectedTemplate.variables_metadata).every(
      key => templateVars[key]?.trim()
    );

    if (!allFilled) {
      toast.error("Completa todas las variables del template");
      return;
    }

    try {
      await generatePreview(selectedTemplateId, { variables: templateVars });
      setShowPreview(true);
    } catch (error) {
      toast.error("Error al generar vista previa");
      console.error(error);
    }
  };

  const handleSubmit = async (data: ReminderFormData) => {
    try {
      setIsSubmitting(true);

      // Construir scheduled_at en formato ISO 8601
      const scheduledAt = new Date(data.scheduledDate);
      const [hours, minutes] = data.scheduledTime.split(':');
      scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Construir request según tipo
      const request: CreateReminderRequest = {
        channel: data.channel,
        reminder_type: data.reminderType,
        scheduled_at: scheduledAt.toISOString(),
      };

      // Agregar destinatario
      if (data.targetType === "individual" && data.client) {
        request.client = data.client;
        
        // Agregar teléfono (solo WhatsApp por ahora)
        const selectedClient = clients.find(c => c.id === data.client);
        if (selectedClient) {
          request.phone_number = selectedClient.primary_contact_phone ?? selectedClient.phone ?? undefined;
        }
      } else if (data.targetType === "group" && data.clientGroup) {
        request.client_group = data.clientGroup;
      }

      // Agregar mensaje o template
      if (data.messageMode === "template" && data.template) {
        request.template = data.template;
        request.template_variables = (data.templateVariables || {}) as Record<string, string>;
      } else if (data.messageMode === "custom" && data.message) {
        request.message = data.message;
      }

      // Agregar recurrencia si no es "once"
      if (data.recurrence !== "once") {
        request.recurrence = data.recurrence;
        request.recurrence_time = `${data.scheduledTime}:00`;
        
        if (data.recurrence === "weekly" && data.recurrenceWeekday !== undefined) {
          request.recurrence_weekday = data.recurrenceWeekday as 0 | 1 | 2 | 3 | 4 | 5 | 6;
        }
        
        if (data.recurrenceEndDate) {
          request.recurrence_end_date = format(data.recurrenceEndDate, 'yyyy-MM-dd');
        }
      }

      await onSubmit(request);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Tipo de destinatario */}
          <FormField
            control={form.control}
            name="targetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Recordatorio</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="individual" id="individual" />
                      <Label htmlFor="individual">Individual</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="group" id="group" />
                      <Label htmlFor="group">Grupal</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Canal - Solo WhatsApp por ahora */}
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Canal</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="WhatsApp" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Próximamente: Email y SMS
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Destinatario - Cliente o Grupo */}
          {targetType === "individual" ? (
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.full_name}
                          {client.phone && ` (${client.phone})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <FormField
              control={form.control}
              name="clientGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupo de Clientes</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un grupo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name} ({group.member_count} miembros)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Tipo de reminder */}
          <FormField
            control={form.control}
            name="reminderType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="appointment">Cita</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                    <SelectItem value="promotional">Promocional</SelectItem>
                    <SelectItem value="follow_up">Seguimiento</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Modo de mensaje: Template o Personalizado */}
          <FormField
            control={form.control}
            name="messageMode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modo de Mensaje</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="template" id="template" />
                      <Label htmlFor="template">Template de WhatsApp</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom">Mensaje Personalizado</Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormDescription>
                  Los templates son requeridos por WhatsApp Business API para mensajes masivos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Template Selector */}
          {messageMode === "template" && (
            <>
              <FormField
                control={form.control}
                name="template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seleccionar Template</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            📋 {template.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Solo se muestran templates aprobados por WhatsApp
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Variables del Template */}
              {isLoadingTemplate && (
                <div className="p-4 border rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground">Cargando template...</p>
                </div>
              )}
              
              {!isLoadingTemplate && selectedTemplate && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium">Variables del Template</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedTemplate.description}
                  </p>
                  
                  <div className="space-y-3">
                    {selectedTemplate.variables_metadata && Object.entries(selectedTemplate.variables_metadata).map(([key, meta]) => (
                      <div key={key}>
                        <Label htmlFor={`var-${key}`}>
                          {meta.description}
                        </Label>
                        <Input
                          id={`var-${key}`}
                          placeholder={meta.example}
                          value={templateVars[key] || ''}
                          onChange={(e) => {
                            const newVars = { ...templateVars, [key]: e.target.value };
                            setTemplateVars(newVars);
                            form.setValue('templateVariables', newVars);
                          }}
                          className="mt-1"
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreview}
                    disabled={isPreviewLoading}
                    className="w-full"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {isPreviewLoading ? "Generando..." : "Vista Previa"}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Mensaje Personalizado */}
          {messageMode === "custom" && (
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensaje</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Escribe tu mensaje aquí..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Puedes usar variables: {"{client_name}"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Fecha y hora */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="scheduledDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Selecciona una fecha</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hora</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Recurrencia */}
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recurrencia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona recurrencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="once">Una vez</SelectItem>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Día de la semana (solo para semanal) */}
          {recurrence === "weekly" && (
            <FormField
              control={form.control}
              name="recurrenceWeekday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Día de la semana</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un día" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(WEEKDAYS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Fecha de fin (para recurrentes) */}
          {recurrence !== "once" && (
            <FormField
              control={form.control}
              name="recurrenceEndDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de fin (opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: es })
                          ) : (
                            <span>Sin fecha de fin</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Deja vacío para que se repita indefinidamente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Recordatorio"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vista Previa del Mensaje</DialogTitle>
            <DialogDescription>
              Así se verá el mensaje que recibirán tus clientes
            </DialogDescription>
          </DialogHeader>
          {preview && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Template: {preview.template_display_name}</p>
                <div className="whitespace-pre-wrap text-sm">
                  {preview.rendered_message}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}