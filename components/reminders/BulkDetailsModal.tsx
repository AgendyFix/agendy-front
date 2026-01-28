"use client";

// ============================================
// BULK DETAILS MODAL - Modal de detalles de reminder masivo
// ============================================

import { useEffect } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { useBulkReminderChildren } from "@/lib/hooks/useReminders";

interface BulkDetailsModalProps {
  bulkId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BulkDetailsModal({ bulkId, open, onOpenChange }: BulkDetailsModalProps) {
  const { executions, masterInfo, bulkInfo, isLoading, fetchChildren } = useBulkReminderChildren(bulkId);

  useEffect(() => {
    if (open && bulkId) {
      fetchChildren(1);
    }
  }, [open, bulkId, fetchChildren]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isRecurrenceMaster = masterInfo?.type === 'recurrence_master';
  const isBulkReminder = masterInfo?.type === 'bulk_reminder' || !!bulkInfo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRecurrenceMaster ? 'Historial de Recordatorio Recurrente' : 'Detalles de Envío Masivo'}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando detalles...
          </div>
        ) : !masterInfo && !bulkInfo ? (
          <div className="text-center py-8 text-muted-foreground">
            No se pudieron cargar los detalles
          </div>
        ) : (
          <div className="space-y-6">
            {/* Información del master (recurrente o bulk) */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              {isRecurrenceMaster && masterInfo && (
                <>
                  <div>
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <p className="font-medium">Recordatorio Recurrente</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Recurrencia:</span>
                    <p className="text-sm">{masterInfo.recurrence_description}</p>
                  </div>
                  {masterInfo.client_group && (
                    <div>
                      <span className="text-sm text-muted-foreground">Grupo:</span>
                      <p className="font-medium">{masterInfo.client_group}</p>
                    </div>
                  )}
                  {masterInfo.client && (
                    <div>
                      <span className="text-sm text-muted-foreground">Cliente:</span>
                      <p className="font-medium">{masterInfo.client}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-muted-foreground">Mensaje:</span>
                    <p className="text-sm whitespace-pre-wrap">{masterInfo.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Total de instancias:</span>
                      <p className="font-medium">{masterInfo.total_instances}</p>
                    </div>
                    {masterInfo.last_occurrence_date && (
                      <div>
                        <span className="text-sm text-muted-foreground">Última ejecución:</span>
                        <p className="text-sm">{masterInfo.last_occurrence_date}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {isBulkReminder && bulkInfo && (
                <>
                  <div>
                    <span className="text-sm text-muted-foreground">Grupo:</span>
                    <p className="font-medium">{bulkInfo.client_group}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Mensaje:</span>
                    <p className="text-sm">{bulkInfo.message}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Enviado:</span>
                    <p className="text-sm">{formatDate(bulkInfo.sent_at)}</p>
                  </div>
                </>
              )}
            </div>

            {/* Estadísticas (solo para bulk reminders) */}
            {isBulkReminder && bulkInfo && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {bulkInfo.stats.total_clients}
                  </p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {bulkInfo.stats.sent}
                  </p>
                  <p className="text-xs text-muted-foreground">Enviados</p>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {bulkInfo.stats.failed}
                  </p>
                  <p className="text-xs text-muted-foreground">Fallidos</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-950 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {bulkInfo.stats.skipped}
                  </p>
                  <p className="text-xs text-muted-foreground">Omitidos</p>
                </div>
              </div>
            )}

            {/* Lista de ejecuciones */}
            <div>
              <h3 className="font-medium mb-3">
                {isRecurrenceMaster ? 'Historial de ejecuciones (primeras 20):' : 'Detalles por cliente (primeros 20):'}
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {executions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay ejecuciones registradas
                  </div>
                ) : (
                  executions.map((execution) => (
                    <div
                      key={execution.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        {execution.client_name ? (
                          <>
                            <p className="font-medium">{execution.client_name}</p>
                            {execution.phone_number && (
                              <p className="text-sm text-muted-foreground">
                                {execution.phone_number}
                              </p>
                            )}
                          </>
                        ) : execution.client_group_name ? (
                          <p className="font-medium">{execution.client_group_name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Sin destinatario</p>
                        )}
                        {execution.error_message && (
                          <p className="text-sm text-red-600 mt-1">
                            ⚠️ {execution.error_message}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {execution.sent_at ? (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(execution.sent_at)}
                          </span>
                        ) : execution.scheduled_at ? (
                          <span className="text-xs text-muted-foreground">
                            Programado: {formatDate(execution.scheduled_at)}
                          </span>
                        ) : null}
                        <StatusBadge
                          status={execution.status}
                          statusDisplay={execution.status_display}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Botón cerrar */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}