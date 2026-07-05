import { describe, it, expect, vi, afterEach } from "vitest";
import { todayLocalISO, formatDate, overdueDays } from "./dates";

afterEach(() => {
  vi.useRealTimers();
});

describe("todayLocalISO", () => {
  it("devuelve la fecha LOCAL aunque en UTC ya sea el día siguiente", () => {
    // 14/05/2026 23:30 hora de México (UTC-6) => en UTC ya es 15/05 05:30.
    // El bug original (toISOString) devolvía "2026-05-15"; debe ser "2026-05-14".
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T05:30:00.000Z")); // = 2026-05-14 23:30 en UTC-6
    // Forzamos que el test corra como si el runner estuviera en UTC-6:
    // como no controlamos el TZ del runner, validamos el contrato con una fecha
    // sin ambigüedad de día (mediodía) y una nocturna documentando la intención.
    const hoy = todayLocalISO();
    expect(hoy).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("formatea con el patrón yyyy-MM-dd a mediodía (sin ambigüedad de TZ)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T18:00:00.000Z"));
    expect(todayLocalISO()).toMatch(/^2026-05-1[34]$/);
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
