import { format } from "date-fns";

/** Fecha de hoy en zona horaria local como "YYYY-MM-DD" (nunca UTC). */
export function todayLocalISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Formatea una fecha "YYYY-MM-DD" como "dd/mm/yyyy" SIN desplazamiento por
 * zona horaria (parsea por partes, no con new Date(string) que asume UTC).
 */
export function formatDate(date?: string | null): string {
  if (!date) return "—";
  const [y, m, d] = date.split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

/**
 * Días de atraso de un vencimiento "YYYY-MM-DD" respecto a hoy (local).
 * Parsea la fecha en local (new Date(y, m-1, d)) para evitar el off-by-one
 * que produce new Date("YYYY-MM-DD") al interpretarla como medianoche UTC.
 */
export function overdueDays(dueDate?: string | null): number {
  if (!dueDate) return 0;
  const [y, m, d] = dueDate.split("-").map(Number);
  if (!y || !m || !d) return 0;
  const due = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86_400_000));
}
