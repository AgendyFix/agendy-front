import { describe, it, expect } from "vitest";
import { parseApiError, parseFieldErrors } from "./apiError";

// Simula un AxiosError con response.data
function axiosErr(status: number, data: unknown) {
  return { response: { status, data }, message: `Request failed with status code ${status}`, isAxiosError: true };
}

describe("parseApiError", () => {
  it("extrae 'detail' de DRF (login: no muestra 'Request failed...')", () => {
    const err = axiosErr(401, { detail: "La combinación de credenciales no tiene una cuenta activa" });
    expect(parseApiError(err)).toBe("La combinación de credenciales no tiene una cuenta activa");
  });

  it("extrae el primer error de validación de campo", () => {
    const err = axiosErr(400, { amount_paid: ["El monto debe ser mayor a 0"] });
    expect(parseApiError(err)).toBe("El monto debe ser mayor a 0");
  });

  it("extrae non_field_errors", () => {
    const err = axiosErr(400, { non_field_errors: ["Registro duplicado"] });
    expect(parseApiError(err)).toBe("Registro duplicado");
  });

  it("acepta data string plano", () => {
    const err = axiosErr(500, "Error interno");
    expect(parseApiError(err)).toBe("Error interno");
  });

  it("mensaje de red cuando no hay respuesta del servidor", () => {
    const err = { message: "Network Error" };
    expect(parseApiError(err)).toContain("conectar");
  });

  it("usa el fallback provisto si no puede parsear", () => {
    const err = axiosErr(500, {});
    expect(parseApiError(err, "Error al registrar el pago")).toBe("Error al registrar el pago");
  });
});

describe("parseFieldErrors", () => {
  it("separa errores por campo y generales", () => {
    const err = axiosErr(400, {
      amount_paid: ["Monto inválido"],
      detail: "Algo salió mal",
    });
    const { fieldErrors, general } = parseFieldErrors(err);
    expect(fieldErrors.amount_paid).toBe("Monto inválido");
    expect(general).toBe("Algo salió mal");
  });
});
