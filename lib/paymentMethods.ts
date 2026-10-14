import type { PaymentMethod, PaymentMethodCode } from "@/lib/types/models";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

/** Métodos que la academia puede mostrar en su página pública (orden de presentación). */
export const PUBLIC_PAYMENT_METHODS: readonly PaymentMethodCode[] = ["cash", "transfer", "card"];
