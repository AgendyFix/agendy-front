// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DisciplineManagerModal } from "./DisciplineManagerModal";
import { disciplinesApi } from "@/lib/api/disciplines";
import type { Discipline } from "@/lib/types/models";

// happy-dom no implementa estas APIs que Radix Select usa internamente
// (pointer capture / scrollIntoView del listbox). Sin este polyfill, abrir
// el Select revienta con "not a function".
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// ── Mock del hook useDisciplines ────────────────────────────────────────────
// Se mockea completo (en vez de MSW) para controlar la lista y forzar el
// 409 del borrado sin depender del hook real ni de axios.
const mocks = vi.hoisted(() => {
  const disciplines: Discipline[] = [
    {
      id: "d1",
      name: "Ballet",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "d2",
      name: "Jazz",
      is_active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ];
  return {
    disciplines,
    fetchDisciplines: vi.fn().mockResolvedValue(undefined),
    createDiscipline: vi.fn(),
    updateDiscipline: vi.fn(),
    deleteDiscipline: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/hooks/useDisciplines", () => ({
  useDisciplines: () => ({
    disciplines: mocks.disciplines,
    isLoading: false,
    fetchDisciplines: mocks.fetchDisciplines,
    createDiscipline: mocks.createDiscipline,
    updateDiscipline: mocks.updateDiscipline,
    deleteDiscipline: mocks.deleteDiscipline,
  }),
}));

vi.mock("@/lib/api/disciplines", () => ({
  disciplinesApi: {
    getUsage: vi.fn(),
    merge: vi.fn(),
  },
}));

// sonner no necesita mock especial (toast() no requiere <Toaster/> montado),
// pero silenciamos por si acaso para no ensuciar la salida de los tests.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockedGetUsage = disciplinesApi.getUsage as unknown as ReturnType<typeof vi.fn>;
const mockedMerge = disciplinesApi.merge as unknown as ReturnType<typeof vi.fn>;

describe("DisciplineManagerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchDisciplines.mockResolvedValue(undefined);
    mocks.deleteDiscipline.mockResolvedValue(undefined);
  });

  it("con open=true renderiza el catálogo con los nombres de las disciplinas", async () => {
    render(<DisciplineManagerModal open={true} onOpenChange={vi.fn()} />);

    expect(await screen.findByText("Ballet")).toBeInTheDocument();
    expect(screen.getByText("Jazz")).toBeInTheDocument();
    await waitFor(() => expect(mocks.fetchDisciplines).toHaveBeenCalledWith(true));
  });

  it("borrado con 409: muestra el panel de uso y NO elimina la disciplina", async () => {
    const user = userEvent.setup();
    const usage409 = {
      response: {
        status: 409,
        data: {
          detail: "En uso",
          counts: { employees: 0, class_groups: 1, enrollments: 0, total: 1 },
          employees: [],
          class_groups: [{ id: "g1", name: "Grupo X" }],
          enrollments: [],
        },
      },
    };
    mocks.deleteDiscipline.mockRejectedValueOnce(usage409);

    render(<DisciplineManagerModal open={true} onOpenChange={vi.fn()} />);
    await screen.findByText("Ballet");

    // El botón de borrar por fila (visible al hover, pero siempre clickable).
    await user.click(screen.getByRole("button", { name: "Eliminar Ballet" }));

    // Confirma en el AlertDialog.
    expect(await screen.findByText("¿Eliminar disciplina?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    // Tras el 409: aparece el panel de uso con "Grupo X"...
    expect(await screen.findByText("Grupo X")).toBeInTheDocument();
    expect(mocks.deleteDiscipline).toHaveBeenCalledWith("d1");

    // ...y la disciplina sigue en el catálogo (no se borró).
    expect(screen.getByText("Ballet")).toBeInTheDocument();
  });

  it("fusión: elige destino en el Select, confirma y llama a disciplinesApi.merge(source, target)", async () => {
    const user = userEvent.setup();
    mockedGetUsage.mockResolvedValue({
      discipline: { id: "d1", name: "Ballet" },
      counts: { employees: 0, class_groups: 1, enrollments: 0, total: 1 },
      employees: [],
      class_groups: [{ id: "g1", name: "Grupo X" }],
      enrollments: [],
    });
    mockedMerge.mockResolvedValue({ id: "d2", name: "Jazz" });

    render(<DisciplineManagerModal open={true} onOpenChange={vi.fn()} />);
    await screen.findByText("Ballet");

    await user.click(
      screen.getByRole("button", { name: "Fusionar Ballet con otra disciplina" })
    );

    expect(await screen.findByText(/Fusionar disciplina/i)).toBeInTheDocument();
    await waitFor(() => expect(mockedGetUsage).toHaveBeenCalledWith("d1"));

    // Abrir el Select y elegir "Jazz" como destino.
    const trigger = screen.getByRole("combobox");
    await user.click(trigger);
    const option = await screen.findByRole("option", { name: "Jazz" });
    await user.click(option);

    // Con destino elegido debe mostrarse el conteo de asignaciones a mover.
    expect(await screen.findByText(/Se moverán/i)).toBeInTheDocument();

    // Confirmar la fusión (botón del footer, distinto del botón de icono de la fila).
    await user.click(screen.getByRole("button", { name: "Fusionar" }));

    await waitFor(() => expect(mockedMerge).toHaveBeenCalledWith("d1", "d2"));
  });
});
