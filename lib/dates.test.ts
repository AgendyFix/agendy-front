import { describe, it, expect, vi, afterEach } from "vitest";
import { todayLocalISO, formatDate, overdueDays } from "./dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("todayLocalISO", () => {
  // El runner corre con TZ=America/Merida (UTC-6), fijada en el script de test.
  // Esto vuelve el test RIGUROSO: una regresión a toISOString() (el bug del
  // +1 día) haría fallar estas aserciones.

  it("de noche (UTC ya es el día siguiente) devuelve el día LOCAL, no el UTC", () => {
    // 2026-05-15T04:00:00Z = 2026-05-14 22:00 en Mérida.
    // Correcto (local) => "2026-05-14".  toISOString() daría "2026-05-15".
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T04:00:00.000Z"));
    expect(todayLocalISO()).toBe("2026-05-14");
  });

  it("de madrugada UTC-6 también respeta el día local", () => {
    // 2026-01-01T05:59:00Z = 2025-12-31 23:59 en Mérida.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T05:59:00.000Z"));
    expect(todayLocalISO()).toBe("2025-12-31");
  });

  it("de día devuelve el día correcto", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-04T18:00:00.000Z")); // 12:00 Mérida
    expect(todayLocalISO()).toBe("2026-07-04");
  });
});

describe("formatDate", () => {
  it("formatea YYYY-MM-DD como dd/mm/yyyy sin desplazamiento", () => {
    expect(formatDate("2026-07-04")).toBe("04/07/2026");
    expect(formatDate("2026-01-31")).toBe("31/01/2026");
  });

  it("devuelve — para vacío/null/inválido", () => {
    expect(formatDate("")).toBe("—");
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("basura")).toBe("—");
  });
});

describe("overdueDays", () => {
  it("0 días para un vencimiento que es HOY (regresión del off-by-one UTC)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 4, 10, 0, 0)); // 4 jul 2026 10:00 local
    expect(overdueDays("2026-07-04")).toBe(0);
  });

  it("cuenta los días de atraso correctamente", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 10, 8, 0, 0)); // 10 jul 2026 local
    expect(overdueDays("2026-07-04")).toBe(6);
  });

  it("nunca es negativo para fechas futuras", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 1, 8, 0, 0));
    expect(overdueDays("2026-07-20")).toBe(0);
  });

  it("0 para vacío/null", () => {
    expect(overdueDays(null)).toBe(0);
    expect(overdueDays(undefined)).toBe(0);
    expect(overdueDays("")).toBe(0);
  });
});
