export const MAX_PRICES = 20;
export const MAX_PROMOTIONS = 10;

/** Convierte el texto de un input numérico a entero >= 0, o null si está vacío. */
export function parseMoney(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  return digits === "" ? null : parseInt(digits, 10);
}
