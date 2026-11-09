// ============================================
// Cobros al inscribir: cuota de inscripción + primera mensualidad
// ============================================
// Lógica pura compartida por "Nuevo alumno" (clients/new) e "Inscribir alumno"
// (enrollments/new). La UI vive en components/enrollments/EnrollmentCharges.tsx.
//
// Regla de negocio (espejo del backend, apps/companies/services.py):
// el PRIMER cobro de una inscripción tiene FIRST_CHARGE_GRACE_DAYS de gracia.
// - Su periodo es el mes de max(fecha de inicio, hoy): la tarea diaria solo
//   genera el mes en curso (first_charge_period).
// - Si no se registra pago, el aviso de vencido sale el día
//   max(vencimiento, fecha de inicio, hoy) + 7  (first_charge_grace_until).

import type { InitialPaymentInline } from "@/lib/types/api";

export const FIRST_CHARGE_GRACE_DAYS = 7;

export type PaymentMethodValue = "cash" | "card" | "transfer" | "other";

export interface EnrollmentChargesValue {
  /** ¿Cobra cuota de inscripción? */
  signupEnabled: boolean;
  signupFee: string;
  signupPaid: string;
  /** ¿Ya pagó la primera mensualidad? */
  paidFirstMonth: boolean;
  paymentAmount: string;
  paymentMethod: PaymentMethodValue;
}

export const EMPTY_CHARGES: EnrollmentChargesValue = {
  signupEnabled: false,
  signupFee: "",
  signupPaid: "",
  paidFirstMonth: false,
  paymentAmount: "",
  paymentMethod: "cash",
};

/** Estado de la cuota de inscripción al elegir un grupo (marcada si el grupo tiene cuota). */
export function chargesForGroup(
  prev: EnrollmentChargesValue,
  groupSignupFee: number | null | undefined,
): EnrollmentChargesValue {
  const fee = groupSignupFee && groupSignupFee > 0 ? groupSignupFee : null;
  return {
    ...prev,
    signupEnabled: fee !== null,
    signupFee: fee !== null ? String(fee) : "",
    signupPaid: "",
  };
}

// ── Fechas (siempre "YYYY-MM-DD" en local, sin pasar por UTC) ────────────────

function parseISO(iso: string): Date | null {
  const [y, m, d] = (iso || "").split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Vencimiento del primer cobro: el día de pago dentro del mes de
 * max(fecha de inicio, hoy) (día de pago vacío = día de la fecha de inicio;
 * tope al último día del mes). Espejo de services.first_charge_period.
 */
export function firstDueDate(
  startDate: string,
  billingDay: string | number | null | undefined,
  todayISO: string,
): string | null {
  const start = parseISO(startDate);
  if (!start) return null;
  const ref = parseISO([startDate, todayISO].sort().at(-1)!) ?? start;
  const day = Number(billingDay) >= 1 && Number(billingDay) <= 28 ? Number(billingDay) : start.getDate();
  const lastDay = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  return toISO(new Date(ref.getFullYear(), ref.getMonth(), Math.min(day, lastDay)));
}

/** Día en que saldría el aviso de vencido si no se registra el primer pago. */
export function firstChargeReminderDate(
  startDate: string,
  billingDay: string | number | null | undefined,
  todayISO: string,
): string | null {
  const due = firstDueDate(startDate, billingDay, todayISO);
  if (!due) return null;
  const base = [due, startDate, todayISO].sort().at(-1)!; // ISO ordena como fecha
  const d = parseISO(base)!;
  d.setDate(d.getDate() + FIRST_CHARGE_GRACE_DAYS);
  return toISO(d);
}

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-11-16" → "16 de noviembre" */
export function formatDayMonth(iso: string): string {
  const d = parseISO(iso);
  if (!d) return "";
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
}

// ── Validación y payload ────────────────────────────────────────────────────

/** Mensaje de error del bloque, o null si es válido. */
export function validateCharges(v: EnrollmentChargesValue, monthlyFee: number | null): string | null {
  if (v.signupEnabled) {
    const fee = Number(v.signupFee);
    if (!v.signupFee || isNaN(fee) || fee <= 0) return "Captura el costo de la cuota de inscripción";
    const paid = Number(v.signupPaid || 0);
    if (isNaN(paid) || paid < 0) return "El pago de la inscripción no es válido";
    if (paid > fee) return "Lo pagado de la inscripción no puede ser mayor a su costo";
  }
  if (v.paidFirstMonth) {
    const amount = Number(v.paymentAmount);
    if (!v.paymentAmount || isNaN(amount) || amount <= 0) return "Captura cuánto pagó de la mensualidad";
    if (monthlyFee != null && monthlyFee > 0 && amount > monthlyFee) {
      return `El pago no puede ser mayor a la mensualidad ($${monthlyFee.toLocaleString("es-MX")})`;
    }
  }
  return null;
}

/**
 * Campos para POST /enrollments/ o el enrollment inline de POST /clients/.
 * `paymentDate` es cuándo pagó (hoy); el periodo que cubre lo decide el
 * backend (el del primer cobro).
 */
export function chargesPayload(v: EnrollmentChargesValue, paymentDate: string): {
  signup_fee: number | null;
  signup_fee_paid?: number;
  initial_payment?: InitialPaymentInline;
} {
  const out: ReturnType<typeof chargesPayload> = { signup_fee: null };
  if (v.signupEnabled && Number(v.signupFee) > 0) {
    out.signup_fee = Number(v.signupFee);
    if (Number(v.signupPaid) > 0) out.signup_fee_paid = Number(v.signupPaid);
  }
  if (v.paidFirstMonth && Number(v.paymentAmount) > 0) {
    out.initial_payment = {
      amount_paid: Number(v.paymentAmount),
      payment_method: v.paymentMethod,
      payment_date: paymentDate,
    };
  }
  return out;
}
