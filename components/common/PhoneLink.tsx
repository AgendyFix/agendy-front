"use client";

// ============================================
// PHONE LINK - Teléfono que abre WhatsApp (o llamada si no hay forma válida)
// ============================================

import { whatsappUrl } from "@/lib/phone";
import { cn } from "@/lib/utils";

interface PhoneLinkProps {
  phone: string;
  /** Nombre del contacto, para el aria-label */
  name: string;
  className?: string;
}

export function PhoneLink({ phone, name, className }: PhoneLinkProps) {
  const wa = whatsappUrl(phone);
  return (
    <a
      href={wa ?? `tel:${phone}`}
      {...(wa ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      aria-label={`${wa ? "WhatsApp" : "Llamar"} a ${name}: ${phone}`}
      // Las filas de Alumnos/Instructores navegan al hacer click: no propagar
      onClick={(e) => e.stopPropagation()}
      className={cn("tabular-nums", wa && "text-green-700", className)}
    >
      {phone}
    </a>
  );
}
