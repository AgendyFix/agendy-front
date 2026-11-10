// ============================================
// PHONE - Enlaces de contacto a partir del teléfono guardado
// ============================================

/** Lada por defecto: hoy el backend guarda teléfonos mexicanos de 10 dígitos sin lada. */
const DEFAULT_COUNTRY_CODE = "52";

/**
 * URL de chat de WhatsApp (wa.me) para un teléfono guardado, solo con formas conocidas:
 * - 10 dígitos → México (+52).
 * - "+" y 11–15 dígitos → se usa tal cual (lada internacional, E.164).
 * - 52 + 10 dígitos → tal cual; 521 + 10 (celular MX viejo) → 52 + 10.
 * Cualquier otra cosa (044/01, extensiones, números cortos) → null, para caer a tel:.
 */
export function whatsappUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (raw.trim().startsWith("+") && digits.length >= 11 && digits.length <= 15) return `https://wa.me/${digits}`;
  if (digits.length === 10) return `https://wa.me/${DEFAULT_COUNTRY_CODE}${digits}`;
  if (digits.length === 12 && digits.startsWith("52")) return `https://wa.me/${digits}`;
  if (digits.length === 13 && digits.startsWith("521")) return `https://wa.me/52${digits.slice(3)}`;
  return null;
}
