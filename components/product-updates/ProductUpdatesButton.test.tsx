// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProductUpdatesButton } from "./ProductUpdatesButton";
import { productUpdatesApi } from "@/lib/api/productUpdates";
import type { ProductUpdatesResponse } from "@/lib/api/productUpdates";

// happy-dom no implementa estas APIs que Radix Popover usa internamente
// (pointer capture / scrollIntoView). Sin este polyfill, abrir el popover
// revienta con "not a function".
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

vi.mock("@/lib/api/productUpdates", () => ({
  productUpdatesApi: {
    list: vi.fn(),
    markSeen: vi.fn(),
  },
}));

const mockedList = productUpdatesApi.list as unknown as ReturnType<typeof vi.fn>;
const mockedMarkSeen = productUpdatesApi.markSeen as unknown as ReturnType<typeof vi.fn>;

const response: ProductUpdatesResponse = {
  unseen: 2,
  results: [
    {
      id: 1,
      title: "Nuevo módulo de pagos",
      body: "Ahora puedes registrar pagos parciales.",
      version: "1.4.0",
      published_at: "2026-07-05T10:00:00Z",
    },
    {
      id: 2,
      title: "Mejoras en el calendario",
      body: "El calendario ahora carga más rápido.",
      version: null,
      published_at: "2026-06-20T10:00:00Z",
    },
  ],
};

describe("ProductUpdatesButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedMarkSeen.mockResolvedValue(undefined);
  });

  it("muestra el badge con el conteo de novedades no vistas", async () => {
    mockedList.mockResolvedValue(response);

    render(<ProductUpdatesButton />);

    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledTimes(1);
  });

  it("al abrir el panel llama a markSeen y el badge desaparece", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(response);

    render(<ProductUpdatesButton />);

    expect(await screen.findByText("2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Novedades/i }));

    await waitFor(() => expect(mockedMarkSeen).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("renderiza los títulos de las novedades en el panel", async () => {
    const user = userEvent.setup();
    mockedList.mockResolvedValue(response);

    render(<ProductUpdatesButton />);

    await screen.findByText("2");
    await user.click(screen.getByRole("button", { name: /Novedades/i }));

    expect(await screen.findByText("Nuevo módulo de pagos")).toBeInTheDocument();
    expect(screen.getByText("Mejoras en el calendario")).toBeInTheDocument();
  });

  it("si falla el fetch inicial no muestra badge y no rompe el render", async () => {
    mockedList.mockRejectedValue(new Error("network error"));

    render(<ProductUpdatesButton />);

    await waitFor(() => expect(mockedList).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Novedades/i })).toBeInTheDocument();
  });
});
