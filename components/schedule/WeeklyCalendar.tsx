"use client";

// ============================================
// WEEKLY CALENDAR - Tipo Google Calendar
// ============================================

import { useState, useRef, useEffect, useCallback } from "react";
import { Calendar, Clock, Users, DollarSign, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ClassGroup } from "@/lib/types/models";

// ── Constants ─────────────────────────────────────────────────────────────────

const SLOT_H  = 64;   // px por hora
const HOUR_W  = 52;   // px columna horas
const PAD     = 2;    // px entre bloques solapados

const DAYS_SHORT = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const DAYS_FULL  = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

const LEVEL_LABELS: Record<string, string> = {
  all: "Todos los niveles", beginner: "Principiante",
  intermediate: "Intermedio",  advanced: "Avanzado",
};

export const GROUP_COLORS = [
  { bg: "bg-blue-100",    border: "border-blue-500",    text: "text-blue-900",    dot: "bg-blue-500"    },
  { bg: "bg-violet-100",  border: "border-violet-500",  text: "text-violet-900",  dot: "bg-violet-500"  },
  { bg: "bg-emerald-100", border: "border-emerald-500", text: "text-emerald-900", dot: "bg-emerald-500" },
  { bg: "bg-orange-100",  border: "border-orange-500",  text: "text-orange-900",  dot: "bg-orange-500"  },
  { bg: "bg-pink-100",    border: "border-pink-500",    text: "text-pink-900",    dot: "bg-pink-500"    },
  { bg: "bg-teal-100",    border: "border-teal-500",    text: "text-teal-900",    dot: "bg-teal-500"    },
  { bg: "bg-amber-100",   border: "border-amber-500",   text: "text-amber-900",   dot: "bg-amber-500"   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

export function to12h(time: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${period}`;
}

function toMins(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function fmtHour(h: number): string {
  if (h === 0)  return "12 AM";
  if (h < 12)   return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

// ── Overlap resolution ────────────────────────────────────────────────────────

interface RawBlock { group: ClassGroup; scheduleIdx: number; colorIdx: number }
interface Block extends RawBlock { col: number; totalCols: number }

function resolveOverlaps(blocks: RawBlock[]): Block[] {
  if (!blocks.length) return [];
  const sorted = [...blocks].map((b) => ({
    ...b,
    start: toMins(b.group.schedules[b.scheduleIdx].start_time),
    end:   toMins(b.group.schedules[b.scheduleIdx].end_time),
  })).sort((a, b) => a.start - b.start);

  const cols: number[] = [];
  const colEnds: number[] = [];
  sorted.forEach((block, i) => {
    let col = 0;
    while (colEnds[col] !== undefined && colEnds[col] > block.start) col++;
    cols[i] = col;
    colEnds[col] = block.end;
  });
  const maxCol = Math.max(...cols) + 1;
  return sorted.map((b, i) => ({ ...b, col: cols[i], totalCols: maxCol }));
}

// ── Detail Panel (flotante, sin mover el calendario) ─────────────────────────

function DetailPanel({
  group,
  scheduleIdx,
  onClose,
  onNavigate,
  pos,
}: {
  group: ClassGroup;
  scheduleIdx: number;
  onClose: () => void;
  onNavigate?: (group: ClassGroup) => void;
  pos: { top: number; left?: number; right?: number; fromRight?: boolean };
}) {
  const schedule = group.schedules[scheduleIdx];

  // Para clases individuales, mostrar el nombre del alumno en lugar del nombre del grupo
  const displayTitle = group.is_individual && group.primary_client
    ? group.primary_client.full_name
    : group.name;
  const displaySubtitle = group.is_individual
    ? "Clase individual"
    : (LEVEL_LABELS[group.level] ?? group.level);

  // Precio: para individuales usar primary_enrollment_fee
  const displayFee = group.is_individual
    ? (group.primary_enrollment_fee ?? null)
    : group.monthly_fee;

  return (
    <div
      className="fixed z-50 w-72 rounded-xl border bg-background shadow-xl
                 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        top: pos.top,
        left: pos.left,
        right: pos.right,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-4 border-b">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-tight">{displayTitle}</h3>
          <span className="text-xs text-muted-foreground">{displaySubtitle}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mt-0.5" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">

        {/* Disciplinas */}
        {group.disciplines && group.disciplines.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {group.disciplines.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-xs font-medium"
              >
                {d.name}
              </span>
            ))}
          </div>
        )}

        {/* Horario del bloque clickeado */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          <div>
            <p className="font-medium">{DAYS_FULL[schedule.day_of_week]}</p>
            <p className="text-muted-foreground tabular-nums text-xs">
              {to12h(schedule.start_time)} — {to12h(schedule.end_time)}
            </p>
          </div>
        </div>

        {/* Stats — para colectivos: alumnos + mensualidad; para individuales: solo mensualidad */}
        <div className={`grid gap-2 ${group.is_individual ? "grid-cols-1" : "grid-cols-2"}`}>
          {!group.is_individual && (
            <div className="rounded-lg bg-muted/40 p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-xl font-bold">{group.active_enrollment_count}</p>
              <p className="text-xs text-muted-foreground">Alumnos</p>
            </div>
          )}
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <DollarSign className="h-3.5 w-3.5 text-green-600" />
            </div>
            <p className="text-xl font-bold text-green-700">
              {displayFee != null ? `$${displayFee.toLocaleString("es-MX")}` : "—"}
            </p>
            <p className="text-xs text-muted-foreground">Mensualidad</p>
          </div>
        </div>

        {/* Todos los horarios del grupo */}
        {group.schedules.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {group.is_individual ? "Horarios" : "Horario completo"}
            </p>
            {group.schedules.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-xs">{s.day_of_week_display}</span>
                <span className="text-muted-foreground tabular-nums text-xs">
                  {to12h(s.start_time)} — {to12h(s.end_time)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Instructor — solo para grupos colectivos */}
        {!group.is_individual && group.instructor_name && (
          <div className="text-xs">
            <span className="text-muted-foreground">Instructor: </span>
            <span className="font-medium">{group.instructor_name}</span>
          </div>
        )}

        {/* Teléfono del alumno — solo para individuales */}
        {group.is_individual && group.primary_client?.primary_contact_phone && (
          <div className="text-xs">
            <span className="text-muted-foreground">Teléfono: </span>
            <span className="font-medium">{group.primary_client.primary_contact_phone}</span>
          </div>
        )}

        {/* Acción */}
        {onNavigate && (
          <Button
            variant="outline"
            className="w-full"
            size="sm"
            onClick={() => onNavigate(group)}
          >
            {group.is_individual ? "Ver ficha del alumno" : "Ver grupo completo"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface WeeklyCalendarProps {
  groups: ClassGroup[];
  /** Todos los grupos (para calcular rango de horas incluso con filtro activo) */
  allGroups?: ClassGroup[];
  colorMap?: Record<string, number>;
  onNavigate?: (group: ClassGroup) => void;
  showInstructor?: boolean;
  /** Si true, muestra la línea de hora actual (solo dashboard principal) */
  showCurrentTime?: boolean;
  /** Si true, el componente usa height: 100% del contenedor padre */
  fillHeight?: boolean;
  /** Altura fija en px. Ignorado si fillHeight=true */
  height?: number;
}

export function WeeklyCalendar({
  groups,
  allGroups,
  colorMap,
  onNavigate,
  showInstructor = false,
  showCurrentTime = false,
  fillHeight = false,
  height,
}: WeeklyCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ group: ClassGroup; scheduleIdx: number } | null>(null);
  // Posición exacta del panel en px relativo al contenedor
  const [panelPos, setPanelPos] = useState<{ top: number; left?: number; right?: number }>({ top: 80, left: 60 });

  // ── Hora actual (se actualiza cada minuto) ────────────────────────────────
  // Usamos refs para timeout e interval para poder limpiarlos correctamente
  // aunque el componente se desmonte antes de que disparen.
  const getNowMins = useCallback(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }, []);
  const [nowMins, setNowMins] = useState(getNowMins);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!showCurrentTime) return;
    const tick = () => setNowMins(getNowMins());
    // Esperar al inicio del próximo minuto exacto para evitar deriva
    const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
    const timeout = setTimeout(() => {
      tick();
      intervalRef.current = setInterval(tick, 60_000);
    }, msToNextMinute);
    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showCurrentTime, getNowMins]);

  // Auto-scroll a la hora actual al montar
  useEffect(() => {
    if (!showCurrentTime || !scrollBodyRef.current) return;
    // Pequeño delay para que el DOM esté listo
    const t = setTimeout(() => {
      if (!scrollBodyRef.current) return;
      const mins = getNowMins();
      // minHour no está disponible aquí directamente, usamos el valor calculado abajo
      // Lo calculamos igual que en el render
      const rGroups = allGroups ?? groups;
      let mh = 24;
      rGroups.forEach((g) => g.schedules.forEach((s) => {
        const sh = parseInt(s.start_time.split(":")[0], 10);
        if (sh < mh) mh = sh;
      }));
      if (mh === 24) return;
      mh = Math.max(0, mh - 1);
      const lineTop = ((mins / 60) - mh) * SLOT_H;
      // Scroll para centrar la línea en el viewport del cuerpo
      const visibleH = scrollBodyRef.current.clientHeight;
      scrollBodyRef.current.scrollTop = Math.max(0, lineTop - visibleH / 2);
    }, 100);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCurrentTime]);

  // Rango de horas — usa allGroups si existe (para no saltar al filtrar)
  const rangeGroups = allGroups ?? groups;
  let minHour = 24, maxHour = 0;
  rangeGroups.forEach((g) => g.schedules.forEach((s) => {
    const sh = parseInt(s.start_time.split(":")[0], 10);
    const eh = Math.ceil(toMins(s.end_time) / 60);
    if (sh < minHour) minHour = sh;
    if (eh > maxHour) maxHour = eh;
  }));

  if (minHour === 24) {
    return (
      <div className="flex flex-col items-center py-10 gap-2 text-center">
        <Calendar className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Sin horarios registrados</p>
      </div>
    );
  }

  minHour = Math.max(0, minHour - 1);
  maxHour = Math.min(24, maxHour + 1);

  // Garantizar un rango mínimo de 8 horas para que el calendario no quede muy chico.
  // Se expande preferentemente hacia abajo; si toca el tope de 24, se sube el inicio.
  const MIN_HOURS = 12;
  if (maxHour - minHour < MIN_HOURS) {
    const deficit = MIN_HOURS - (maxHour - minHour);
    maxHour = Math.min(24, maxHour + deficit);
    if (maxHour - minHour < MIN_HOURS) {
      minHour = Math.max(0, maxHour - MIN_HOURS);
    }
  }

  const hours   = Array.from({ length: maxHour - minHour }, (_, i) => minHour + i);
  const totalH  = hours.length * SLOT_H;

  // Bloques por día
  const rawByDay: RawBlock[][] = DAYS_SHORT.map(() => []);
  groups.forEach((group, gIdx) => {
    const cIdx = colorMap?.[group.id] ?? gIdx % GROUP_COLORS.length;
    group.schedules.forEach((_, sIdx) => {
      rawByDay[group.schedules[sIdx].day_of_week].push({ group, scheduleIdx: sIdx, colorIdx: cIdx });
    });
  });
  const blocksByDay = rawByDay.map(resolveOverlaps);

  const containerStyle = fillHeight
    ? { height: "100%" }
    : { height: height ?? 500 };

  return (
    <div ref={containerRef} className="relative flex border rounded-lg overflow-hidden" style={containerStyle}>

      {/* ── Calendario — ocupa todo el ancho siempre ── */}
      <div className="flex flex-col w-full min-w-0">

        {/* Header días — fijo */}
        <div
          className="grid bg-muted/40 border-b shrink-0"
          style={{ gridTemplateColumns: `${HOUR_W}px repeat(7, 1fr)` }}
        >
          <div className="border-r" />
          {DAYS_SHORT.map((d) => (
            <div key={d} className="py-2 text-center text-[11px] font-semibold text-muted-foreground border-r last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* Cuerpo — scroll vertical */}
        <div ref={scrollBodyRef} className="overflow-y-auto flex-1">
          <div
            className="grid relative"
            style={{ gridTemplateColumns: `${HOUR_W}px repeat(7, 1fr)`, height: totalH }}
          >
            {/* Horas */}
            <div className="border-r relative bg-background">
              {hours.map((h, i) => (
                <div key={h} className="absolute w-full" style={{ top: i * SLOT_H }}>
                  <span className="text-[10px] text-muted-foreground px-1.5 pt-0.5 block leading-none">
                    {fmtHour(h)}
                  </span>
                </div>
              ))}
              {/* Punto rojo en la columna de horas */}
              {showCurrentTime && nowMins >= minHour * 60 && nowMins <= maxHour * 60 && (
                <div
                  className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                  style={{ top: ((nowMins / 60) - minHour) * SLOT_H - 4 }}
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0 ml-auto mr-0.5" />
                </div>
              )}
            </div>

            {/* Línea roja horizontal que cruza todos los días */}
            {showCurrentTime && nowMins >= minHour * 60 && nowMins <= maxHour * 60 && (
              <div
                className="absolute z-30 pointer-events-none"
                style={{
                  top: ((nowMins / 60) - minHour) * SLOT_H,
                  left: HOUR_W,
                  right: 0,
                  height: 1,
                  backgroundColor: "rgb(239 68 68)", // red-500
                }}
              />
            )}

            {/* Columnas días */}
            {blocksByDay.map((blocks, dayIdx) => (
              <div key={dayIdx} className="relative border-r last:border-r-0">
                {hours.map((_, i) => (
                  <div key={i} className="absolute w-full border-t border-muted/50" style={{ top: i * SLOT_H }} />
                ))}

                {blocks.map((block, bi) => {
                  const schedule  = block.group.schedules[block.scheduleIdx];
                  const startMins = toMins(schedule.start_time);
                  const endMins   = toMins(schedule.end_time);
                  const top        = ((startMins / 60) - minHour) * SLOT_H;
                  const rawH       = ((endMins - startMins) / 60) * SLOT_H - 2;
                  // Altura real en px según duración; min 20px para que no desaparezca
                  const h          = Math.max(rawH, 20);
                  // Si el bloque es más alto que su espacio natural, lo dejamos "salir" visualmente
                  // usando overflow-visible — el contenido se muestra completo encima de otras celdas
                  const isShort    = rawH < 48;
                  const color  = GROUP_COLORS[block.colorIdx];
                  const colW   = block.totalCols > 1
                    ? `calc(${100 / block.totalCols}% - ${PAD}px)`
                    : "calc(100% - 4px)";
                  const left   = block.totalCols > 1
                    ? `calc(${(block.col / block.totalCols) * 100}% + ${PAD / 2}px)`
                    : "2px";

                  const isSelected = selected?.group.id === block.group.id
                    && selected?.scheduleIdx === block.scheduleIdx;

                  const isNarrow = block.totalCols > 1;

                  // Nombre principal: para individuales mostrar el alumno, no el nombre técnico del grupo
                  const displayName = block.group.is_individual && block.group.primary_client?.full_name
                    ? block.group.primary_client.full_name
                    : block.group.name;

                  // Disciplinas del grupo (primera si hay varias, para no ocupar espacio)
                  const disciplineLabel = block.group.disciplines?.length
                    ? block.group.disciplines.map((d) => d.name).join(" · ")
                    : null;

                  const tooltipText = `${displayName}${disciplineLabel ? ` · ${disciplineLabel}` : ""} · ${to12h(schedule.start_time)}–${to12h(schedule.end_time)}${block.group.instructor_name ? ` · ${block.group.instructor_name}` : ""}`;

                  return (
                    <button
                      key={bi}
                      title={tooltipText}
                      className={`absolute rounded border-l-[3px] px-1 py-0.5 text-left transition-all cursor-pointer shadow-sm z-[41]
                        ${isShort ? "overflow-visible" : "overflow-hidden"}
                        ${color.bg} ${color.border} ${color.text}
                        ${isSelected ? "ring-2 ring-offset-1 ring-current opacity-100" : "hover:opacity-85 opacity-90"}`}
                      style={{ top, height: h, width: colW, left }}
                      onClick={(e) => {
                        if (isSelected) {
                          setSelected(null);
                          return;
                        }
                        const blockRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const PANEL_W = 288; // w-72
                        const PANEL_H = 420; // altura real del panel
                        const GAP     = 8;

                        // Coordenadas en viewport (fixed)
                        // Vertical: alinear con el tope del bloque, clamp para no salirse
                        const topRaw = blockRect.top;
                        const maxTop = window.innerHeight - PANEL_H - 8;
                        const top = Math.min(Math.max(topRaw, 8), maxTop);

                        // Horizontal: a la derecha del bloque si cabe, sino a la izquierda
                        const spaceRight = window.innerWidth - blockRect.right;
                        const spaceLeft  = blockRect.left;

                        if (spaceRight >= PANEL_W + GAP) {
                          setPanelPos({ top, left: blockRect.right + GAP });
                        } else if (spaceLeft >= PANEL_W + GAP) {
                          setPanelPos({ top, right: window.innerWidth - blockRect.left + GAP });
                        } else {
                          // Sin espacio lateral: centrar horizontalmente
                          setPanelPos({ top, left: Math.max((window.innerWidth - PANEL_W) / 2, 8) });
                        }
                        setSelected({ group: block.group, scheduleIdx: block.scheduleIdx });
                      }}
                    >
                      {isShort ? (
                        /* Bloque corto (< 48px): nombre en una línea + hora compacta */
                        <p className="text-[11px] font-semibold leading-tight truncate">
                          {displayName}
                          <span className="font-normal opacity-70 ml-1 tabular-nums">
                            {to12h(schedule.start_time)}–{to12h(schedule.end_time)}
                          </span>
                        </p>
                      ) : isNarrow ? (
                        /* Bloque angosto (solapado): nombre + hora en dos líneas */
                        <>
                          <p className="text-[11px] font-semibold leading-tight truncate">
                            {displayName}
                          </p>
                          <p className="text-[10px] opacity-70 tabular-nums leading-tight">
                            {to12h(schedule.start_time)}–{to12h(schedule.end_time)}
                          </p>
                          {disciplineLabel && h > 52 && (
                            <p className="text-[10px] opacity-65 truncate leading-tight">
                              {disciplineLabel}
                            </p>
                          )}
                        </>
                      ) : (
                        /* Bloque normal: nombre + disciplina + hora */
                        <>
                          <p className="text-xs font-semibold leading-tight truncate">
                            {displayName}
                          </p>
                          {disciplineLabel && (
                            <p className="text-[11px] opacity-80 truncate leading-tight">
                              {disciplineLabel}
                            </p>
                          )}
                          <p className="text-[11px] opacity-65 tabular-nums leading-tight">
                            {to12h(schedule.start_time)}–{to12h(schedule.end_time)}
                          </p>
                          {showInstructor && block.group.instructor_name && h > 72 && (
                            <p className="text-[11px] opacity-55 truncate leading-tight">
                              {block.group.instructor_name}
                            </p>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Overlay invisible — click fuera cierra el panel ── */}
      {selected && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSelected(null)}
        />
      )}

      {/* ── Panel flotante — posicionado junto al bloque clickeado ── */}
      {selected && (
        <DetailPanel
          group={selected.group}
          scheduleIdx={selected.scheduleIdx}
          pos={panelPos}
          onClose={() => setSelected(null)}
          onNavigate={onNavigate ? (g) => { setSelected(null); onNavigate(g); } : undefined}
        />
      )}
    </div>
  );
}
