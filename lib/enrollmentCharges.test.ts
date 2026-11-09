import { describe, it, expect } from "vitest";
import {
  EMPTY_CHARGES, chargesForGroup, chargesPayload, firstChargeReminderDate,
  firstDueDate, formatDayMonth, validateCharges, type EnrollmentChargesValue,
} from "./enrollmentCharges";

const v = (patch: Partial<EnrollmentChargesValue>): EnrollmentChargesValue => ({
  ...EMPTY_CHARGES, ...patch,
});

describe("firstDueDate", () => {
  const HOY = "2026-11-09";
  it("sin día de pago usa el día de inicio", () => {
    expect(firstDueDate("2026-11-09", "", HOY)).toBe("2026-11-09");
  });
  it("con día de pago usa ese día en el mes de inicio", () => {
    expect(firstDueDate("2026-11-06", "17", HOY)).toBe("2026-11-17");
    expect(firstDueDate("2026-11-20", 5, HOY)).toBe("2026-11-05");
  });
  it("inicio en mes anterior → el primer cobro es el del mes en curso", () => {
    expect(firstDueDate("2026-10-28", "", "2026-11-02")).toBe("2026-11-28");
  });
  it("inicio en mes futuro → el primer cobro es el del mes de inicio", () => {
    expect(firstDueDate("2026-12-01", "", HOY)).toBe("2026-12-01");
  });
  it("día 30 en un mes de 28 días se topa al último día", () => {
    expect(firstDueDate("2026-01-30", "", "2026-02-03")).toBe("2026-02-28");
  });
  it("ignora días de pago fuera de 1-28", () => {
    expect(firstDueDate("2026-11-09", "40", HOY)).toBe("2026-11-09");
  });
  it("fecha inválida → null", () => {
    expect(firstDueDate("", "", HOY)).toBeNull();
  });
});

// Mismos casos que apps/companies/test_gracia_primer_cobro.py (backend)
describe("firstChargeReminderDate (7 días de gracia del primer cobro)", () => {
  it("inscrita hoy con inicio hoy → aviso en 7 días", () => {
    expect(firstChargeReminderDate("2026-11-09", "", "2026-11-09")).toBe("2026-11-16");
  });
  it("fecha de inicio en el pasado → cuenta desde hoy (caso real)", () => {
    expect(firstChargeReminderDate("2026-11-03", "", "2026-11-06")).toBe("2026-11-13");
  });
  it("día de pago posterior → cuenta desde el vencimiento", () => {
    expect(firstChargeReminderDate("2026-11-06", "17", "2026-11-06")).toBe("2026-11-24");
  });
  it("inicio en el futuro → cuenta desde el inicio", () => {
    expect(firstChargeReminderDate("2026-12-01", "", "2026-11-09")).toBe("2026-12-08");
  });
  it("inicio en mes anterior → cuenta desde el cobro del mes en curso", () => {
    expect(firstChargeReminderDate("2026-10-28", "", "2026-11-02")).toBe("2026-12-05");
  });
  it("fin de mes con día de pago 1 → mismo día que el backend (4-dic)", () => {
    expect(firstChargeReminderDate("2026-11-27", "1", "2026-11-27")).toBe("2026-12-04");
  });
  it("cruza de mes y de año", () => {
    expect(firstChargeReminderDate("2026-12-28", "", "2026-12-28")).toBe("2027-01-04");
  });
});

describe("formatDayMonth", () => {
  it("formatea en español", () => {
    expect(formatDayMonth("2026-11-16")).toBe("16 de noviembre");
    expect(formatDayMonth("2027-01-04")).toBe("4 de enero");
  });
});

describe("chargesForGroup", () => {
  it("grupo con cuota → casilla marcada y costo propuesto", () => {
    const next = chargesForGroup(v({ signupPaid: "100" }), 300);
    expect(next.signupEnabled).toBe(true);
    expect(next.signupFee).toBe("300");
    expect(next.signupPaid).toBe("");
  });
  it("grupo sin cuota → casilla desmarcada", () => {
    const next = chargesForGroup(v({ signupEnabled: true, signupFee: "300" }), null);
    expect(next.signupEnabled).toBe(false);
    expect(next.signupFee).toBe("");
  });
  it("no toca la primera mensualidad", () => {
    const next = chargesForGroup(v({ paidFirstMonth: true, paymentAmount: "450" }), 300);
    expect(next.paidFirstMonth).toBe(true);
    expect(next.paymentAmount).toBe("450");
  });
});

describe("validateCharges", () => {
  it("nada marcado es válido", () => {
    expect(validateCharges(EMPTY_CHARGES, 450)).toBeNull();
  });
  it("cuota marcada sin costo es inválida", () => {
    expect(validateCharges(v({ signupEnabled: true }), 450)).toMatch(/costo/);
  });
  it("lo pagado de la cuota no excede su costo", () => {
    expect(validateCharges(v({ signupEnabled: true, signupFee: "300", signupPaid: "301" }), 450)).toMatch(/mayor/);
    expect(validateCharges(v({ signupEnabled: true, signupFee: "300", signupPaid: "300" }), 450)).toBeNull();
  });
  it("pago marcado sin monto es inválido", () => {
    expect(validateCharges(v({ paidFirstMonth: true }), 450)).toMatch(/cuánto/);
  });
  it("el pago no excede la mensualidad", () => {
    expect(validateCharges(v({ paidFirstMonth: true, paymentAmount: "451" }), 450)).toMatch(/\$450/);
    expect(validateCharges(v({ paidFirstMonth: true, paymentAmount: "450" }), 450)).toBeNull();
    expect(validateCharges(v({ paidFirstMonth: true, paymentAmount: "200" }), 450)).toBeNull();
  });
});

describe("chargesPayload", () => {
  it("nada marcado → sin cuota y sin pago inicial", () => {
    expect(chargesPayload(EMPTY_CHARGES, "2026-11-09")).toEqual({ signup_fee: null });
  });
  it("cuota con anticipo", () => {
    expect(chargesPayload(v({ signupEnabled: true, signupFee: "300", signupPaid: "100" }), "2026-11-09"))
      .toEqual({ signup_fee: 300, signup_fee_paid: 100 });
  });
  it("cuota sin pago no manda signup_fee_paid", () => {
    expect(chargesPayload(v({ signupEnabled: true, signupFee: "300" }), "2026-11-09"))
      .toEqual({ signup_fee: 300 });
  });
  it("cuota desmarcada ignora lo capturado", () => {
    expect(chargesPayload(v({ signupEnabled: false, signupFee: "300" }), "2026-11-09"))
      .toEqual({ signup_fee: null });
  });
  it("primera mensualidad pagada → initial_payment con la fecha de inicio", () => {
    expect(chargesPayload(
      v({ paidFirstMonth: true, paymentAmount: "450", paymentMethod: "transfer" }), "2026-11-03",
    )).toEqual({
      signup_fee: null,
      initial_payment: { amount_paid: 450, payment_method: "transfer", payment_date: "2026-11-03" },
    });
  });
  it("pago desmarcado no manda initial_payment", () => {
    expect(chargesPayload(v({ paidFirstMonth: false, paymentAmount: "450" }), "2026-11-09"))
      .toEqual({ signup_fee: null });
  });
});
