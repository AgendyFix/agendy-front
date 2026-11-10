"use client";

// ============================================
// Bloque "Cobros al inscribir" — compartido por Nuevo alumno e Inscribir alumno
// ============================================
// Dos casillas en vez de formularios siempre abiertos:
//  ☐ Cuota de inscripción        → se abre costo + cuánto pagó.
//                                   Viene marcada si el grupo tiene cuota.
//  ☐ Ya pagó la primera mensualidad → se abre monto + método.
//     Sin marcar: se explica cuándo se le avisará (7 días de gracia).

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { BellRing, CheckCircle2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { todayLocalISO } from "@/lib/dates";
import {
  chargesForGroup, firstChargeReminderDate, formatDayMonth,
  type EnrollmentChargesValue, type PaymentMethodValue,
} from "@/lib/enrollmentCharges";

interface Props {
  value: EnrollmentChargesValue;
  /** Setter de useState: los efectos usan updates funcionales para no pisarse. */
  onChange: Dispatch<SetStateAction<EnrollmentChargesValue>>;
  /** Mensualidad efectiva (precio especial o la del grupo). */
  monthlyFee: number | null;
  startDate: string;
  billingDay?: string;
  /**
   * Grupo seleccionado (ya cargado): al cambiar, la cuota se propone desde el
   * grupo. Pasar undefined mientras los grupos no hayan cargado, si no la
   * cuota se propondría vacía.
   */
  groupId?: string;
  groupSignupFee?: number | null;
  disabled?: boolean;
  /** Prefijo para ids de inputs (evita duplicados si hay dos bloques en la página). */
  idPrefix?: string;
}

const money = (n: number) => `$${n.toLocaleString("es-MX")}`;

function CheckRow({
  id, checked, onChange, disabled, title, hint,
}: {
  id: string; checked: boolean; onChange: (v: boolean) => void;
  disabled?: boolean; title: string; hint: string;
}) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 cursor-pointer select-none">
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium leading-none">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}

export function EnrollmentCharges({
  value, onChange, monthlyFee, startDate, billingDay,
  groupId, groupSignupFee, disabled, idPrefix = "charges",
}: Props) {
  // Proponer la cuota del grupo cada vez que cambia el grupo elegido.
  // (No en el primer render sin grupo, para no pisar lo que traiga el form.)
  const lastGroup = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!groupId || groupId === lastGroup.current) return;
    lastGroup.current = groupId;
    onChange((prev) => chargesForGroup(prev, groupSignupFee));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, groupSignupFee]);

  // Si cambia la mensualidad (otro grupo / precio especial) y el monto
  // capturado era la mensualidad anterior, se actualiza para no convertirlo
  // en "anticipo" sin que nadie lo note.
  const lastFee = useRef<number | null>(monthlyFee);
  useEffect(() => {
    const prev = lastFee.current;
    lastFee.current = monthlyFee;
    if (prev === monthlyFee) return;
    onChange((cur) => {
      if (!cur.paidFirstMonth) return cur;
      if (cur.paymentAmount !== "" && Number(cur.paymentAmount) !== prev) return cur;
      return { ...cur, paymentAmount: monthlyFee ? String(monthlyFee) : "" };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthlyFee]);

  const set = (patch: Partial<EnrollmentChargesValue>) => onChange((cur) => ({ ...cur, ...patch }));

  const signupTotal = Number(value.signupFee || 0);
  const signupPaid = Number(value.signupPaid || 0);
  const payAmount = Number(value.paymentAmount || 0);
  const reminder = firstChargeReminderDate(startDate, billingDay, todayLocalISO());

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-4">
      <p className="text-sm font-semibold">
        Cobros al inscribir
      </p>

      {/* ── Cuota de inscripción ── */}
      <div className="space-y-3">
        <CheckRow
          id={`${idPrefix}-signup`}
          checked={value.signupEnabled}
          disabled={disabled}
          onChange={(checked) => set({ signupEnabled: checked, ...(checked ? {} : { signupFee: "", signupPaid: "" }) })}
          title="Cuota de inscripción"
          hint={groupSignupFee ? `El grupo cobra ${money(groupSignupFee)} de inscripción` : "Cargo único al darse de alta"}
        />
        {value.signupEnabled && (
          <div className="pl-7 space-y-2">
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-signup-fee`}>Costo</Label>
                <Input
                  id={`${idPrefix}-signup-fee`}
                  type="number" inputMode="numeric" min={1} placeholder="Ej: 300"
                  value={value.signupFee}
                  disabled={disabled}
                  onChange={(e) => set({ signupFee: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-signup-paid`}>Pagó hoy</Label>
                <Input
                  id={`${idPrefix}-signup-paid`}
                  type="number" inputMode="numeric" min={0}
                  max={signupTotal || undefined}
                  placeholder="0"
                  value={value.signupPaid}
                  disabled={disabled}
                  onChange={(e) => set({ signupPaid: e.target.value })}
                />
              </div>
            </div>
            {signupTotal > 0 && (
              signupPaid >= signupTotal
                ? <p className="text-xs text-green-600 font-medium">✓ Inscripción liquidada</p>
                : signupPaid > 0
                ? <p className="text-xs text-orange-600 font-medium">Anticipo {money(signupPaid)} — saldo {money(signupTotal - signupPaid)}</p>
                : <p className="text-xs text-muted-foreground">Quedará pendiente {money(signupTotal)}</p>
            )}
          </div>
        )}
      </div>

      {/* ── Primera mensualidad ── */}
      <div className="space-y-3">
        <CheckRow
          id={`${idPrefix}-paid`}
          checked={value.paidFirstMonth}
          disabled={disabled}
          onChange={(checked) => set({
            paidFirstMonth: checked,
            paymentAmount: checked && monthlyFee ? String(monthlyFee) : "",
          })}
          title="Ya pagó la primera mensualidad"
          hint={monthlyFee ? `Mensualidad: ${money(monthlyFee)}` : "Marca si te pagó al inscribirse"}
        />
        {value.paidFirstMonth ? (
          <div className="pl-7 space-y-2">
            <div className="grid gap-3 grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`${idPrefix}-pay-amount`}>Monto</Label>
                <Input
                  id={`${idPrefix}-pay-amount`}
                  type="number" inputMode="numeric" min={1}
                  max={monthlyFee || undefined}
                  value={value.paymentAmount}
                  disabled={disabled}
                  onChange={(e) => set({ paymentAmount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Método</Label>
                <Select
                  value={value.paymentMethod}
                  onValueChange={(v) => set({ paymentMethod: v as PaymentMethodValue })}
                  disabled={disabled}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                    <SelectItem value="card">Tarjeta</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {monthlyFee != null && monthlyFee > 0 && payAmount > 0 && (
              payAmount >= monthlyFee
                ? <p className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" /> Mensualidad pagada completa</p>
                : <p className="text-xs text-orange-600 font-medium">Anticipo {money(payAmount)} — saldo {money(monthlyFee - payAmount)}</p>
            )}
          </div>
        ) : (
          // Sin mensualidad no se genera cobro ni aviso (el backend omite $0)
          reminder && !!monthlyFee && (
            <p className="pl-7 flex items-start gap-1.5 text-xs text-muted-foreground">
              <BellRing className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                La mensualidad queda como <strong className="text-foreground">Pendiente</strong>.
                Si para el <strong className="text-foreground">{formatDayMonth(reminder)}</strong> no
                se ha registrado el pago, se le enviará un WhatsApp de pago vencido.
              </span>
            </p>
          )
        )}
      </div>
    </div>
  );
}
