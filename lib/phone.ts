// ============================================
// PHONE - Enlaces de contacto a partir del teléfono guardado
// ============================================

/** Lada por defecto: hoy el backend guarda teléfonos mexicanos de 10 dígitos sin lada. */
const DEFAULT_COUNTRY_CODE = "52";

/**
 * URL de chat de WhatsApp (wa.me) para un teléfono guardado.
 * - 10 dígitos → se asume México (+52).
 * - Con lada ("+1 …", "52…") → se usa tal cual; así sirve cuando el backend
 *   guarde números internacionales.
 * - "521" + 10 dígitos (formato viejo de celular MX) → 52 + 10 dígitos.
 * Devuelve null si no hay dígitos suficientes.
 */
export function whatsappUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.length === 10 && !raw.trim().startsWith("+")) digits = DEFAULT_COUNTRY_CODE + digits;
  else if (digits.length === 13 && digits.startsWith("521")) digits = "52" + digits.slice(3);
  return `https://wa.me/${digits}`;
}
