/** Slug del feature flag del módulo "Mi Sitio" (catálogo en el backend: apps/companies/features.py). */
export const PUBLIC_SITE_FEATURE = "public_site";

export const MAX_PRICES = 20;
export const MAX_PROMOTIONS = 10;

/** Convierte el texto de un input numérico a entero >= 0, o null si está vacío. */
export function parseMoney(raw: string): number | null {
  const digits = raw.replace(/\D/g, "");
  return digits === "" ? null : parseInt(digits, 10);
}

/** Colores sugeridos para el sitio (vivos, funcionan sobre tema oscuro). El primero es el de la marca AgendyFix. */
export const ACCENT_SWATCHES = [
  { name: "Naranja AgendyFix", hex: "#EE8545" },
  { name: "Magenta", hex: "#FF2E88" },
  { name: "Violeta", hex: "#7B5CFF" },
  { name: "Cian", hex: "#00C2FF" },
  { name: "Verde", hex: "#00D68F" },
  { name: "Ámbar", hex: "#FFB020" },
  { name: "Coral", hex: "#FF5A36" },
  { name: "Rojo", hex: "#E11D48" },
] as const;
