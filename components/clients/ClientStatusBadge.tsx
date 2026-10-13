// ============================================
// CLIENT STATUS BADGE - Estado derivado del alumno (fuente única de label/color)
// ============================================

import type { ClientEnrollmentStatus } from "@/lib/types/models";

const STATUS_BADGE: Record<ClientEnrollmentStatus, { label: string; className: string }> = {
  active:  { label: "Activo",  className: "bg-green-100 text-green-700"   },
  paused:  { label: "Pausado", className: "bg-yellow-100 text-yellow-700" },
  dropped: { label: "Baja",    className: "bg-red-100 text-red-700"       },
  new:     { label: "Nuevo",   className: "bg-violet-100 text-violet-700" },
};

export function ClientStatusBadge({ status }: { status: ClientEnrollmentStatus }) {
  const { label, className } = STATUS_BADGE[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${className}`}>
      {label}
    </span>
  );
}
