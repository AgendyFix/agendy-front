import { format } from "date-fns";

/** Fecha de hoy en zona horaria local como "YYYY-MM-DD" (nunca UTC). */
export function todayLocalISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
