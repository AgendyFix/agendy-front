// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { RegisterPaymentForm } from "./RegisterPaymentForm";
import { enrollmentsApi } from "@/lib/api/enrollments";
import { toast } from "sonner";
import type { UnpaidEnrollment } from "@/lib/types/models";

// Mockeamos el módulo de API completo: evita que el componente dispare
// llamadas HTTP reales (axios) durante los tests.
vi.mock("@/lib/api/enrollments", () => ({
  enrollmentsApi: {
    getAll: vi.fn(),
    getBillingStatus: vi.fn(),
  },
}));

// Mockeamos sonner para poder verificar los toast.error() del componente
// (fallo de billing-status) sin depender de la UI real de las notificaciones.
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const mockedGetBillingStatus = enrollmentsApi.getBillingStatus as unknown as ReturnType<typeof vi.fn>;
const mockedGetAll = enrollmentsApi.getAll as unknown as ReturnType<typeof vi.fn>;

const preselected: UnpaidEnrollment = {
  enrollment_id: "enr-1",
  client_id: "cli-1",
  client_name: "Ana García",
  client_phone: "5551234567",
  class_group_name: "Ballet Intermedio",
  monthly_fee: 1200,
};

const billingStatus = {
  mode: "liquidar" as const,
  period: "2026-07-02",
  period_label: "julio 2026",
  balance: 1000,
  monthly_fee: 1200,
  open_payment_id: "x",
  has_older_debt: false,
};

/** "YYYY-MM-DD" del día 2 del mes calendario anterior al actual (para que
 *  isPriorMonth() del componente lo detecte como deuda vieja sin depender
 *  de la fecha en que corran los tests). */
function priorMonthISO(): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-02`;
}

const olderDebtBillingStatus = {
  mode: "liquidar" as const,
  period: priorMonthISO(),
  period_label: "mes anterior",
  balance: 800,
  monthly_fee: 1200,
  open_payment_id: "y",
  has_older_debt: true,
};

const currentMonthBillingStatus = {
  mode: "nuevo" as const,
  period: "2026-08-02",
  period_label: "agosto 2026",
  balance: 1200,
  monthly_fee: 1200,
  open_payment_id: null,
  has_older_debt: true,
};

describe("RegisterPaymentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetBillingStatus.mockResolvedValue(billingStatus);
    mockedGetAll.mockResolvedValue({ results: [], count: 0, next: null, previous: null });
  });

  it("renderiza con preselectedEnrollment y no llama a getAll (sin fetch de lista)", async () => {
    render(
      <RegisterPaymentForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    expect(screen.getByText("Ana García")).toBeInTheDocument();
    expect(screen.getByText("Ballet Intermedio")).toBeInTheDocument();

    // Espera a que resuelva el billing-status (efecto async).
    await waitFor(() => expect(mockedGetBillingStatus).toHaveBeenCalledWith("enr-1"));
    expect(mockedGetAll).not.toHaveBeenCalled();
  });

  it("muestra el banner de periodo con el period_label cuando resuelve billing-status", async () => {
    render(
      <RegisterPaymentForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    // mode: "liquidar" -> "Liquidando julio 2026 — saldo pendiente: $1,000"
    // (usamos "Liquidando" porque "julio 2026" aparece dos veces: en el banner
    // y en el feedback "✓ Liquida julio 2026" una vez el saldo se autocompleta).
    const banner = await screen.findByText(/Liquidando/i);
    expect(banner).toBeInTheDocument();
    expect(banner.textContent).toContain("julio 2026");
    expect(screen.getAllByText(/julio 2026/i).length).toBeGreaterThan(0);
  });

  it("con un monto 0 o negativo NO llama a onSubmit y muestra el error de validación", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RegisterPaymentForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    // Esperamos a que cargue el billing-status (autocompleta el monto con el saldo).
    await screen.findByText(/Liquidando/i);

    const amountInput = screen.getByLabelText(/Monto recibido/i);
    await user.clear(amountInput);
    await user.type(amountInput, "0");

    const submitBtn = screen.getByRole("button", { name: /Registrar/i });
    await user.click(submitBtn);

    expect(await screen.findByText("El monto debe ser mayor a 0")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    // Monto negativo: mismo resultado.
    await user.clear(amountInput);
    await user.type(amountInput, "-50");
    await user.click(submitBtn);

    expect(await screen.findByText("El monto debe ser mayor a 0")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("con un monto válido llama a onSubmit con amount_paid numérico", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <RegisterPaymentForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    await screen.findByText(/Liquidando/i);

    const amountInput = screen.getByLabelText(/Monto recibido/i);
    await user.clear(amountInput);
    await user.type(amountInput, "1000");

    const submitBtn = screen.getByRole("button", { name: /Registrar/i });
    await user.click(submitBtn);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.amount_paid).toBe(1000);
    expect(typeof payload.amount_paid).toBe("number");
    expect(payload.enrollment).toBe("enr-1");
  });

  it("con un monto que excede el saldo del periodo NO llama a onSubmit y muestra el error de tope", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <RegisterPaymentForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    // billing.balance = 1000 (ver mock de arriba)
    await screen.findByText(/Liquidando/i);

    const amountInput = screen.getByLabelText(/Monto recibido/i);
    await user.clear(amountInput);
    await user.type(amountInput, "1500");

    const submitBtn = screen.getByRole("button", { name: /Registrar/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/El saldo de julio 2026 es \$1,000/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("si falla el fetch de saldo (billing null) y se intenta cobrar, avisa con toast y no envía", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    mockedGetBillingStatus.mockRejectedValueOnce(new Error("network error"));

    render(
      <RegisterPaymentForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    // Esperamos a que el fetch de billing-status resuelva (con rechazo) —
    // billing queda en null y no hay banner de periodo.
    await waitFor(() => expect(mockedGetBillingStatus).toHaveBeenCalledWith("enr-1"));

    const amountInput = screen.getByLabelText(/Monto recibido/i);
    await user.clear(amountInput);
    await user.type(amountInput, "500");

    const submitBtn = screen.getByRole("button", { name: /Registrar/i });
    await user.click(submitBtn);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "No se pudo verificar el saldo del periodo. Intenta de nuevo."
      )
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("no pisa el monto si el usuario ya escribió antes de que resuelva el billing-status", async () => {
    const user = userEvent.setup();
    let resolveBilling: (value: typeof billingStatus) => void = () => {};
    mockedGetBillingStatus.mockImplementationOnce(
      () => new Promise((resolve) => { resolveBilling = resolve; })
    );

    render(
      <RegisterPaymentForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    const amountInput = screen.getByLabelText(/Monto recibido/i);
    // El usuario escribe ANTES de que el fetch de billing-status resuelva.
    await user.clear(amountInput);
    await user.type(amountInput, "500");

    // Ahora resuelve con balance=1000: no debe pisar el "500" ya tecleado.
    await act(async () => {
      resolveBilling(billingStatus);
    });

    await waitFor(() => expect(amountInput).toHaveValue(500));
  });

  it("NO muestra el selector 'Aplicar a' en el caso normal (has_older_debt=false)", async () => {
    render(
      <RegisterPaymentForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    await screen.findByText(/Liquidando/i);
    expect(screen.queryByText(/Aplicar a:/i)).not.toBeInTheDocument();
  });

  it("muestra el selector 'Aplicar a' cuando has_older_debt=true y el modo inicial es liquidar de un mes anterior", async () => {
    mockedGetBillingStatus.mockResolvedValue(olderDebtBillingStatus);

    render(
      <RegisterPaymentForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    expect(await screen.findByText(/Aplicar a:/i)).toBeInTheDocument();
    expect(screen.getByText(/Deuda de/i)).toBeInTheDocument();
    // "mes anterior" (period_label) aparece tanto en el selector como en el
    // banner de modo "Liquidando ..." — basta con que exista al menos una vez.
    expect(screen.getAllByText(/mes anterior/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Mes actual")).toBeInTheDocument();
  });

  it("al elegir 'Mes actual' en el selector, refetch con target='current' y re-prellena el monto", async () => {
    const user = userEvent.setup();
    mockedGetBillingStatus.mockResolvedValueOnce(olderDebtBillingStatus);
    mockedGetBillingStatus.mockResolvedValueOnce(currentMonthBillingStatus);

    render(
      <RegisterPaymentForm
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
        preselectedEnrollment={preselected}
      />
    );

    await screen.findByText(/Aplicar a:/i);
    const amountInput = screen.getByLabelText(/Monto recibido/i);
    await waitFor(() => expect(amountInput).toHaveValue(800)); // saldo de la deuda vieja

    await user.click(screen.getByLabelText("Mes actual"));

    await waitFor(() =>
      expect(mockedGetBillingStatus).toHaveBeenCalledWith("enr-1", "current")
    );
    // Re-prellena con el saldo del target actualizado (sin isDirty previo).
    await waitFor(() => expect(amountInput).toHaveValue(1200));
    // La etiqueta de la deuda vieja se mantiene visible aunque el target
    // activo ya sea 'current' (historial visible).
    expect(screen.getByText(/mes anterior/i)).toBeInTheDocument();
  });
});
