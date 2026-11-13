import { describe, expect, it } from "vitest";
import type { ClassGroup, Enrollment, TuitionTable } from "@/lib/types/models";
import { enrollmentSummary, feeFor, packageBillingDay, signupFeeGroup, tiersLabel } from "./tuition";

const TIERS = [
  { count: 1, fee: 450 }, { count: 2, fee: 650 },
  { count: 3, fee: 850 }, { count: 4, fee: 950 },
];
const danza: TuitionTable = { id: "t1", name: "Danza", tiers: TIERS, is_active: true };

const g = (id: string, extra: Partial<ClassGroup> = {}) =>
  ({ id, name: id, tuition_table: "t1", monthly_fee: null, ...extra }) as ClassGroup;
const [a, b, c, d] = ["A", "B", "C", "D"].map((id) => g(id));
const taller = g("Taller", { tuition_table: null, monthly_fee: 300 });
const groups = [a, b, c, d, taller];

const enr = (group: ClassGroup, extra: Partial<Enrollment> = {}) =>
  ({ class_group: group.id, status: "active", custom_monthly_fee: null,
     effective_monthly_fee: 0, ...extra }) as Enrollment;

describe("feeFor", () => {
  it("toma el escalón más alto alcanzado y topa en el último", () => {
    expect(feeFor(TIERS, 0)).toBe(0);
    expect(feeFor(TIERS, 1)).toBe(450);
    expect(feeFor(TIERS, 3)).toBe(850);
    expect(feeFor(TIERS, 6)).toBe(950);
    expect(feeFor([{ count: 3, fee: 800 }, { count: 1, fee: 400 }], 2)).toBe(400);
  });

  it("etiqueta los escalones en orden", () => {
    expect(tiersLabel([TIERS[1], TIERS[0]])).toBe("1 grupo $450 · 2 $650");
    expect(tiersLabel([{ count: "all", fee: 950 }, TIERS[0]])).toBe("1 grupo $450 · Todos $950");
  });
});

describe("enrollmentSummary", () => {
  it("alta con 3 grupos del paquete: un solo cobro por el escalón", () => {
    const s = enrollmentSummary([a, b, c], groups, [danza]);
    expect(s.lines).toEqual([
      { kind: "package", tableId: "t1", name: "Danza", before: 0, after: 3, feeBefore: 0, feeAfter: 850 },
    ]);
    expect(s.monthlyTotal).toBe(850);
    expect(s.firstChargeTotal).toBe(850);
  });

  it("paquete más grupo de precio fijo", () => {
    const s = enrollmentSummary([a, taller, b], groups, [danza]);
    expect(s.lines.map((l) => l.kind)).toEqual(["package", "fixed"]);
    expect(s.monthlyTotal).toBe(950);
    expect(s.firstChargeTotal).toBe(950);
  });

  it("agregar a un paquete existente sube desde el siguiente cobro", () => {
    const s = enrollmentSummary([b], groups, [danza], [enr(a, { effective_monthly_fee: 450 })]);
    expect(s.lines[0]).toMatchObject({ before: 1, after: 2, feeBefore: 450, feeAfter: 650 });
    expect(s.monthlyTotal).toBe(650);
    expect(s.firstChargeTotal).toBe(0);
  });

  it("precio especial, pausadas y precios fijos existentes", () => {
    const s = enrollmentSummary([b], groups, [danza], [
      enr(a, { custom_monthly_fee: 800, effective_monthly_fee: 800 }), // no cuenta para el escalón
      enr(c, { status: "paused" }),                                     // no cuenta
      enr(taller, { effective_monthly_fee: 300 }),
    ]);
    expect(s.lines[0]).toMatchObject({ before: 0, after: 1, feeAfter: 450 });
    expect(s.monthlyTotal).toBe(800 + 300 + 450);
  });

  it("sin tabulador (o inactivo) todo es precio fijo", () => {
    const s = enrollmentSummary([a], groups, [{ ...danza, is_active: false }]);
    expect(s.lines).toEqual([{ kind: "fixed", groupId: "A", name: "A", fee: 0 }]);
  });
});

describe("escalón Todos", () => {
  const conTodos = [TIERS[0], TIERS[1], { count: "all" as const, fee: 900 }];
  it("aplica solo si tiene todos los grupos del paquete", () => {
    expect(feeFor(conTodos, 4, 4)).toBe(900);
    expect(feeFor(conTodos, 3, 4)).toBe(650);
    expect(feeFor(conTodos, 0, 4)).toBe(0);
  });
  it("el resumen cuenta los grupos del paquete", () => {
    const t = { ...danza, tiers: conTodos };
    expect(enrollmentSummary([a, b, c, d], groups, [t]).monthlyTotal).toBe(900);
    expect(enrollmentSummary([a, b, c], groups, [t]).monthlyTotal).toBe(650);
  });
});

describe("helpers de paquetes", () => {
  it("formatea la fecha de inicio y el mes siguiente", async () => {
    const { formatFrom, nextMonthStartLabel, tiersChanged } = await import("./tuition");
    expect(formatFrom("2026-12-01")).toBe("1 de diciembre");
    expect(nextMonthStartLabel(new Date(2026, 10, 12))).toBe("1 de diciembre");
    expect(nextMonthStartLabel(new Date(2026, 11, 31))).toBe("1 de enero");
    expect(tiersChanged(TIERS, TIERS.map((t) => ({ ...t })))).toBe(false);
    expect(tiersChanged(TIERS, TIERS.slice(0, 3))).toBe(true);
    expect(tiersChanged(TIERS, [{ count: 1, fee: 500 }, ...TIERS.slice(1)])).toBe(true);
  });
});

describe("día de pago precargado", () => {
  const act = (billing_day: number, tuition: unknown = null) => ({ status: "active", billing_day, tuition });
  it("precio fijo: no se precarga (aunque empiece el 30)", () => {
    expect(packageBillingDay([act(30)])).toBeUndefined();
    expect(packageBillingDay([act(12)])).toBeUndefined();
  });
  it("paquete: el día del paquete, con tope 28", () => {
    expect(packageBillingDay([act(12, { table_id: "t" })])).toBe("12");
    expect(packageBillingDay([act(31, { table_id: "t" })])).toBe("28");
  });
  it("ignora inscripciones no activas", () => {
    expect(packageBillingDay([{ status: "paused", billing_day: 5, tuition: { table_id: "t" } }])).toBeUndefined();
  });
});

describe("cuota de inscripción una por alumno", () => {
  it("toma el primer grupo con cuota", () => {
    const gs = [{ id: "a", signup_fee: null }, { id: "b", signup_fee: 300 }, { id: "c", signup_fee: 500 }];
    expect(signupFeeGroup(gs)?.id).toBe("b");
  });
  it("sin cuotas: el primero; sin grupos: nada", () => {
    expect(signupFeeGroup([{ id: "a", signup_fee: 0 }])?.id).toBe("a");
    expect(signupFeeGroup([])).toBeUndefined();
  });
});
