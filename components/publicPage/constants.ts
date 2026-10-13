import type { PaymentMethodCode } from "@/lib/types/models";

export const PAYMENT_METHODS: ReadonlyArray<{ code: PaymentMethodCode; label: string }> = [
  { code: "cash", label: "Efectivo" },
  { code: "transfer", label: "Transferencia" },
  { code: "card", label: "Tarjeta" },
];

export const MAX_PRICES = 20;
export const MAX_PROMOTIONS = 10;

/** Convierte el texto de un input numérico a entero >= 0, o null si está vacío. */
export function parseMoney(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  return digits === "" ? null : parseInt(digits, 10);
}
