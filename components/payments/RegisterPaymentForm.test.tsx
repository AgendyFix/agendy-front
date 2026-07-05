// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RegisterPaymentForm } from "./RegisterPaymentForm";
import { enrollmentsApi } from "@/lib/api/enrollments";
import type { UnpaidEnrollment } from "@/lib/types/models";

// Mockeamos el módulo de API completo: evita que el componente dispare
// llamadas HTTP reales (axios) durante los tests.
vi.mock("@/lib/api/enrollments", () => ({
  enrollmentsApi: {
    getAll: vi.fn(),
    getBillingStatus: vi.fn(),
  },
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
});
