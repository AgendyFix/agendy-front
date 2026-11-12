// ============================================
// Tabulador: resumen de mensualidad al inscribir a varios grupos
// ============================================
// Espejo del backend (TuitionTable.fee_for / Enrollment.effective_monthly_fee):
// - Los grupos ligados a un tabulador forman un paquete: el alumno paga UNA
//   mensualidad según cuántos grupos activos del paquete toma.
// - Los grupos sin tabulador cobran su precio fijo.
// - Una inscripción con precio especial no cuenta para el escalón.
// - Agregar grupos a un paquete que ya cobra sube el escalón desde el
//   siguiente cobro (el del mes en curso no cambia).

import type { ClassGroup, Enrollment, TuitionTable, TuitionTier } from "@/lib/types/models";

export const TIER_ALL = "all" as const;

/**
 * Mensualidad para `count` grupos (espejo de TuitionTable.fee_for): si tiene
 * todos los grupos del paquete (`groupCount`) y hay escalón "Todos", ese; si
 * no, el escalón numérico más alto con count <= `count`.
 */
export function feeFor(tiers: TuitionTier[], count: number, groupCount = Infinity): number {
  const all = tiers.find((t) => t.count === TIER_ALL);
  if (all && count > 0 && count >= groupCount) return all.fee;
  const eligible = tiers.filter((t): t is TuitionTier & { count: number } => t.count !== TIER_ALL && t.count <= count);
  if (eligible.length === 0) return 0;
  return eligible.reduce((a, b) => (b.count > a.count ? b : a)).fee;
}

/** "1 grupo $450 · 2 $650 · 3 $850 · Todos $950" */
export function tiersLabel(tiers: TuitionTier[]): string {
  const numeric = tiers
    .filter((t): t is TuitionTier & { count: number } => t.count !== TIER_ALL)
    .sort((a, b) => a.count - b.count);
  const all = tiers.find((t) => t.count === TIER_ALL);
  return [
    ...numeric.map((t, i) => `${t.count}${i === 0 ? (t.count === 1 ? " grupo" : " grupos") : ""} $${t.fee.toLocaleString("es-MX")}`),
    ...(all ? [`Todos $${all.fee.toLocaleString("es-MX")}`] : []),
  ].join(" · ");
}

export interface PackageLine {
  kind: "package";
  tableId: string;
  name: string;
  /** Grupos del paquete que ya tenía (activos, sin precio especial) */
  before: number;
  after: number;
  feeBefore: number;
  feeAfter: number;
}

export interface FixedLine {
  kind: "fixed";
  groupId: string;
  name: string;
  fee: number;
}

export interface EnrollmentSummary {
  lines: (PackageLine | FixedLine)[];
  /** Mensualidad total del alumno después de inscribir (lo que ya tenía + lo nuevo) */
  monthlyTotal: number;
  /**
   * Primera mensualidad de lo NUEVO que se puede cobrar hoy: paquetes nuevos
   * por su escalón y grupos de precio fijo. Un paquete que ya cobraba no
   * suma: su escalón nuevo aplica desde el siguiente cobro.
   */
  firstChargeTotal: number;
}

/**
 * Resumen para la lista de grupos con casillas. `existing`: inscripciones
 * del alumno (se toman las activas); `groups`: todos los grupos cargados,
 * para saber a qué paquete pertenece cada inscripción existente.
 */
export function enrollmentSummary(
  selected: ClassGroup[],
  groups: ClassGroup[],
  tables: TuitionTable[],
  existing: Enrollment[] = [],
): EnrollmentSummary {
  const tableById = new Map(tables.filter((t) => t.is_active).map((t) => [t.id, t]));
  const groupById = new Map(groups.map((g) => [g.id, g]));
  const tableOf = (g?: ClassGroup) => (g?.tuition_table ? tableById.get(g.tuition_table) : undefined);
  // Grupos activos de cada paquete (para el escalón "Todos")
  const packageSize = (tableId: string) =>
    groups.filter((g) => g.tuition_table === tableId && g.is_active !== false && !g.is_individual).length;

  const active = existing.filter((e) => e.status === "active");
  const beforeCount = new Map<string, number>();
  let existingFixed = 0;
  for (const e of active) {
    const table = e.custom_monthly_fee == null ? tableOf(groupById.get(e.class_group)) : undefined;
    if (table) beforeCount.set(table.id, (beforeCount.get(table.id) ?? 0) + 1);
    else existingFixed += e.effective_monthly_fee ?? 0;
  }

  const addCount = new Map<string, number>();
  const fixed: FixedLine[] = [];
  for (const g of selected) {
    const table = tableOf(g);
    if (table) addCount.set(table.id, (addCount.get(table.id) ?? 0) + 1);
    else fixed.push({ kind: "fixed", groupId: g.id, name: g.name, fee: g.monthly_fee ?? 0 });
  }

  const packages: PackageLine[] = [];
  for (const [tableId, table] of tableById) {
    const before = beforeCount.get(tableId) ?? 0;
    const added = addCount.get(tableId) ?? 0;
    if (!before && !added) continue;
    packages.push({
      kind: "package", tableId, name: table.name,
      before, after: before + added,
      feeBefore: feeFor(table.tiers, before, packageSize(tableId)),
      feeAfter: feeFor(table.tiers, before + added, packageSize(tableId)),
    });
  }

  const fixedNew = fixed.reduce((n, l) => n + l.fee, 0);
  return {
    lines: [...packages.filter((p) => p.after > p.before), ...fixed],
    monthlyTotal: existingFixed + fixedNew + packages.reduce((n, p) => n + p.feeAfter, 0),
    firstChargeTotal: fixedNew + packages.filter((p) => p.before === 0).reduce((n, p) => n + p.feeAfter, 0),
  };
}

/** Slug del feature flag de Paquetes (catálogo en el backend: apps/companies/features.py). */
export const TUITION_TABLES_FEATURE = "tuition_tables";

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** "2026-12-01" → "1 de diciembre" */
export function formatFrom(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]}`;
}

/** 1.º del mes siguiente a `today`, como "1 de diciembre" (espejo de TuitionTable.schedule_tiers). */
export function nextMonthStartLabel(today = new Date()): string {
  return `1 de ${MESES[(today.getMonth() + 1) % 12]}`;
}

/** ¿Cambiaron los escalones? (mismo orden: siempre se guardan por count ascendente) */
export function tiersChanged(a: TuitionTier[], b: TuitionTier[]): boolean {
  return a.length !== b.length || a.some((t, i) => t.count !== b[i].count || t.fee !== b[i].fee);
}
