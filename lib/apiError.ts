// ============================================
// Manejo unificado de errores de la API
// ============================================
//
// Convierte cualquier error de axios/DRF en un mensaje legible en español.
// El backend (DRF) responde con formas variadas:
//   - { detail: "mensaje" }                        (errores genéricos)
//   - { campo: ["mensaje1", ...], otro: [...] }    (errores de validación)
//   - { non_field_errors: [...] }                  (validación a nivel objeto)
//   - "texto plano"                                (raro, pero pasa)
// Sin esto, el usuario veía cosas como "Request failed with status code 400".

interface AxiosLikeError {
  response?: { data?: unknown; status?: number };
  message?: string;
}

const FALLBACK = "Ocurrió un error. Intenta de nuevo.";

/** Extrae un mensaje legible de un error de la API. */
export function parseApiError(err: unknown, fallback: string = FALLBACK): string {
  const data = (err as AxiosLikeError)?.response?.data;

  if (typeof data === "string" && data.trim()) return data;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // detail (formato estándar de DRF para errores simples)
    if (typeof obj.detail === "string") return obj.detail;

    // Primer error de validación de campo o non_field_errors
    for (const value of Object.values(obj)) {
      if (Array.isArray(value) && value.length && typeof value[0] === "string") {
        return value[0];
      }
      if (typeof value === "string" && value.trim()) return value;
    }
  }

  // Errores de red / sin respuesta del servidor
  const status = (err as AxiosLikeError)?.response?.status;
  if (!status && (err as AxiosLikeError)?.message) {
    return "No se pudo conectar con el servidor. Revisa tu conexión.";
  }

  return fallback;
}

/**
 * Devuelve los errores por campo (para pintar debajo de cada input) más un
 * mensaje general. Útil en formularios con varios campos.
 */
export function parseFieldErrors(err: unknown): {
  fieldErrors: Record<string, string>;
  general: string | null;
} {
  const data = (err as AxiosLikeError)?.response?.data;
  const fieldErrors: Record<string, string> = {};
  let general: string | null = null;

  if (data && typeof data === "object") {
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const msg = Array.isArray(value) ? String(value[0]) : String(value);
      if (key === "detail" || key === "non_field_errors") general = msg;
      else fieldErrors[key] = msg;
    }
  }

  return { fieldErrors, general };
}
