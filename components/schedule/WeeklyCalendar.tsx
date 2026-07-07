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

/**
 * Agrupa RawBlocks de un mismo día por franja EXACTA (start_time + end_time).
 * Todos los ocupantes de un cluster comparten horario idéntico y se renderizan
 * apilados en una sola celda cuando son más de uno.
 */
interface RawCluster { start: string; end: string; occupants: RawBlock[] }
interface Cluster extends RawCluster { col: number; totalCols: number }

function clusterBlocks(blocks: RawBlock[]): RawCluster[] {
  const map = new Map<string, RawCluster>();
  blocks.forEach((b) => {
    const schedule = b.group.schedules[b.scheduleIdx];
    const key = `${schedule.start_time}|${schedule.end_time}`;
    const existing = map.get(key);
    if (existing) {
      existing.occupants.push(b);
    } else {
      map.set(key, { start: schedule.start_time, end: schedule.end_time, occupants: [b] });
    }
  });
  return Array.from(map.values());
}

/**
 * Resuelve solapamientos por columnas, pero operando sobre CLUSTERS en vez de
 * bloques individuales: dos clusters con franjas parcialmente solapadas (ej.
 * 16:00-17:00 y 16:30-17:30) siguen yendo en columnas separadas; los ocupantes
 * de un mismo cluster (franja EXACTA idéntica) comparten una sola columna/celda.
 */
function resolveClusterOverlaps(clusters: RawCluster[]): Cluster[] {
  if (!clusters.length) return [];
  const sorted = [...clusters].map((c) => ({
    ...c,
    startMins: toMins(c.start),
    endMins:   toMins(c.end),
  })).sort((a, b) => a.startMins - b.startMins);

  const cols: number[] = [];
  const colEnds: number[] = [];
  sorted.forEach((c, i) => {
    let col = 0;
    while (colEnds[col] !== undefined && colEnds[col] > c.startMins) col++;
    cols[i] = col;
    colEnds[col] = c.endMins;
  });
  const maxCol = Math.max(...cols) + 1;
  return sorted.map((c, i) => ({
    start: c.start,
    end: c.end,
    occupants: c.occupants,
    col: cols[i],
    totalCols: maxCol,
  }));
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

// ── Cluster Panel (flotante, lista completa de ocupantes de un cluster) ──────

function ClusterPanel({
  occupants,
  label,
  onClose,
  onNavigate,
  pos,
}: {
  occupants: RawBlock[];
  label: string;
  onClose: () => void;
  onNavigate?: (group: ClassGroup) => void;
  pos: { top: number; left?: number; right?: number };
}) {
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
          <h3 className="font-semibold text-sm leading-tight">{occupants.length} alumnos</h3>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 -mt-0.5" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Lista completa de ocupantes */}
      <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
        {occupants.map((occ, i) => {
          const occColor = GROUP_COLORS[occ.colorIdx];
          const occName = occ.group.is_individual && occ.group.primary_client?.full_name
            ? occ.group.primary_client.full_name
            : occ.group.name;
          const occDiscipline = occ.group.disciplines?.length
            ? occ.group.disciplines.map((d) => d.name).join(" · ")
            : null;

          return (
            <button
              key={i}
              type="button"
              className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/60"
              onClick={() => onNavigate?.(occ.group)}
            >
              <span className={`h-2 w-2 rounded-full shrink-0 ${occColor.dot}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium truncate">{occName}</span>
                {occDiscipline && (
                  <span className="block text-xs text-muted-foreground truncate">{occDiscipline}</span>
                )}
              </span>
              {onNavigate && <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
            </button>
          );
        })}
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

  // ── Panel de cluster (varios ocupantes en la misma franja exacta) ──────────
  const [clusterSel, setClusterSel] = useState<{
    occupants: RawBlock[];
    label: string;
    dayIdx: number;
    start: string;
    end: string;
  } | null>(null);
  const [clusterPanelPos, setClusterPanelPos] = useState<{ top: number; left?: number; right?: number }>({ top: 80, left: 60 });

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
  const clustersByDay: Cluster[][] = rawByDay.map((dayBlocks) =>
    resolveClusterOverlaps(clusterBlocks(dayBlocks))
  );

  const containerStyle = fillHeight
    ? { height: "100%" }
    : { height: height ?? 500 };

  // ── Posicionamiento del panel flotante a partir del rect de un bloque clickeado ──
  // Compartido entre el DetailPanel (bloque de un solo ocupante) y el ClusterPanel.
  const computePanelPos = (rect: DOMRect): { top: number; left?: number; right?: number } => {
    const PANEL_W = 288; // w-72
    const PANEL_H = 420; // altura real del panel
    const GAP     = 8;

    const topRaw = rect.top;
    const maxTop = window.innerHeight - PANEL_H - 8;
    const top = Math.min(Math.max(topRaw, 8), maxTop);

    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft  = rect.left;

    if (spaceRight >= PANEL_W + GAP) {
      return { top, left: rect.right + GAP };
    } else if (spaceLeft >= PANEL_W + GAP) {
      return { top, right: window.innerWidth - rect.left + GAP };
    }
    return { top, left: Math.max((window.innerWidth - PANEL_W) / 2, 8) };
  };

  const openPanelForOccupant = (rect: DOMRect, occupant: RawBlock) => {
    const isSameSelected = selected?.group.id === occupant.group.id
      && selected?.scheduleIdx === occupant.scheduleIdx;
    setClusterSel(null);
    if (isSameSelected) {
      setSelected(null);
      return;
    }
    setPanelPos(computePanelPos(rect));
    setSelected({ group: occupant.group, scheduleIdx: occupant.scheduleIdx });
  };

  // Abre el panel flotante con la lista completa de ocupantes de un cluster.
  const openClusterPanel = (rect: DOMRect, cluster: Cluster, dayIdx: number, label: string) => {
    const isSameSelected = clusterSel?.dayIdx === dayIdx
      && clusterSel?.start === cluster.start
      && clusterSel?.end === cluster.end;
    setSelected(null);
    if (isSameSelected) {
      setClusterSel(null);
      return;
    }
    setClusterPanelPos(computePanelPos(rect));
    setClusterSel({ occupants: cluster.occupants, label, dayIdx, start: cluster.start, end: cluster.end });
  };

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
            {clustersByDay.map((clusters, dayIdx) => (
              <div key={dayIdx} className="relative border-r last:border-r-0">
                {hours.map((_, i) => (
                  <div key={i} className="absolute w-full border-t border-muted/50" style={{ top: i * SLOT_H }} />
                ))}

                {clusters.map((cluster, ci) => {
                  const startMins = toMins(cluster.start);
                  const endMins   = toMins(cluster.end);
                  const top       = ((startMins / 60) - minHour) * SLOT_H;
                  const rawH      = ((endMins - startMins) / 60) * SLOT_H - 2;
                  // Altura real en px según duración; min 20px para que no desaparezca
                  const h         = Math.max(rawH, 20);
                  // Si el bloque es más alto que su espacio natural, lo dejamos "salir" visualmente
                  // usando overflow-visible — el contenido se muestra completo encima de otras celdas
                  const isShort   = rawH < 48;
                  const isNarrow  = cluster.totalCols > 1;
                  const colW      = cluster.totalCols > 1
                    ? `calc(${100 / cluster.totalCols}% - ${PAD}px)`
                    : "calc(100% - 4px)";
                  const left      = cluster.totalCols > 1
                    ? `calc(${(cluster.col / cluster.totalCols) * 100}% + ${PAD / 2}px)`
                    : "2px";

                  // ── Cluster con un solo ocupante: render idéntico al bloque de siempre ──
                  if (cluster.occupants.length === 1) {
                    const occupant  = cluster.occupants[0];
                    const schedule  = occupant.group.schedules[occupant.scheduleIdx];
                    const color     = GROUP_COLORS[occupant.colorIdx];

                    const isSelected = selected?.group.id === occupant.group.id
                      && selected?.scheduleIdx === occupant.scheduleIdx;

                    // Nombre principal: para individuales mostrar el alumno, no el nombre técnico del grupo
                    const displayName = occupant.group.is_individual && occupant.group.primary_client?.full_name
                      ? occupant.group.primary_client.full_name
                      : occupant.group.name;

                    // Disciplinas del grupo (todas, para no perder info)
                    const disciplineLabel = occupant.group.disciplines?.length
                      ? occupant.group.disciplines.map((d) => d.name).join(" · ")
                      : null;

                    const tooltipText = `${displayName}${disciplineLabel ? ` · ${disciplineLabel}` : ""} · ${to12h(schedule.start_time)}–${to12h(schedule.end_time)}${occupant.group.instructor_name ? ` · ${occupant.group.instructor_name}` : ""}`;

                    return (
                      <button
                        key={ci}
                        title={tooltipText}
                        className={`absolute rounded border-l-[3px] px-1 py-0.5 text-left transition-all cursor-pointer shadow-sm z-[41]
                          ${isShort ? "overflow-visible" : "overflow-hidden"}
                          ${color.bg} ${color.border} ${color.text}
                          ${isSelected ? "ring-2 ring-offset-1 ring-current opacity-100" : "hover:opacity-85 opacity-90"}`}
                        style={{ top, height: h, width: colW, left }}
                        onClick={(e) => openPanelForOccupant(
                          (e.currentTarget as HTMLElement).getBoundingClientRect(),
                          occupant
                        )}
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
                            {showInstructor && occupant.group.instructor_name && h > 72 && (
                              <p className="text-[11px] opacity-55 truncate leading-tight">
                                {occupant.group.instructor_name}
                              </p>
                            )}
                          </>
                        )}
                      </button>
                    );
                  }

                  // ── Cluster con varios ocupantes en la MISMA franja exacta: apilados ──
                  // Nombres de disciplina por ocupante, como conjunto ordenado (para comparar
                  // sin importar el orden en que vengan del backend). "" = sin disciplinas.
                  const disciplineSetKey = (o: RawBlock): string =>
                    (o.group.disciplines ?? []).map((d) => d.name).sort().join("|");
                  const firstDisciplineKey = disciplineSetKey(cluster.occupants[0]);
                  const allShareDiscipline = firstDisciplineKey !== ""
                    && cluster.occupants.every((o) => disciplineSetKey(o) === firstDisciplineKey);
                  const clusterDisciplineLabel = allShareDiscipline
                    ? (cluster.occupants[0].group.disciplines ?? []).map((d) => d.name).join(" · ")
                    : null;

                  const firstInstructor = cluster.occupants[0].group.instructor_name || null;
                  const sameInstructor = showInstructor && !!firstInstructor
                    && cluster.occupants.every((o) => o.group.instructor_name === firstInstructor);

                  const headerTitle = clusterDisciplineLabel
                    ? `${clusterDisciplineLabel} · ${cluster.occupants.length} alumnos`
                    : `${cluster.occupants.length} alumnos`;
                  const headerSubtitle = `${to12h(cluster.start)}–${to12h(cluster.end)}${sameInstructor ? ` · ${firstInstructor}` : ""}`;

                  const dayLabel = `${DAYS_FULL[dayIdx]} ${to12h(cluster.start)}–${to12h(cluster.end)}`;
                  const isClusterSelected = clusterSel?.dayIdx === dayIdx
                    && clusterSel?.start === cluster.start
                    && clusterSel?.end === cluster.end;

                  // Filas de ocupante que caben en el alto disponible del bloque.
                  // Sizing ADAPTATIVO por densidad: si sobra alto por alumno ("cómodo"),
                  // usamos texto/filas más grandes y repartimos el alto disponible para
                  // que no quede hueco muerto abajo; si está apretado ("compacto"), igual
                  // que antes: filas chicas + "+N más".
                  const HEADER_H_COMPACTO = 28;
                  const ROW_H_COMPACTO    = 16;
                  const HEADER_H_COMODO   = 30;
                  const ROW_H_COMODO      = 24;

                  // Estimación con el header compacto para decidir el modo según el espacio
                  // que le tocaría a cada fila.
                  const perRow  = Math.max(0, h - HEADER_H_COMPACTO) / cluster.occupants.length;
                  const isComodo = perRow >= 26;

                  const HEADER_H = isComodo ? HEADER_H_COMODO : HEADER_H_COMPACTO;
                  const ROW_H    = isComodo ? ROW_H_COMODO : ROW_H_COMPACTO;
                  const availableH = Math.max(0, h - HEADER_H);
                  const maxFilas   = Math.max(1, Math.floor(availableH / ROW_H));
                  const hasOverflow = cluster.occupants.length > maxFilas;

                  // Al menos 1 chip visible cuando hay ocupantes (evita "solo +N más").
                  const visibles = hasOverflow
                    ? cluster.occupants.slice(0, Math.max(1, maxFilas - 1))
                    : cluster.occupants;
                  const ocultos = cluster.occupants.length - visibles.length;

                  return (
                    <button
                      key={ci}
                      type="button"
                      title={`${headerTitle} · ${headerSubtitle}`}
                      className={`absolute rounded border shadow-sm z-[41] flex flex-col overflow-hidden text-left transition-all cursor-pointer
                        bg-card border-border
                        ${isClusterSelected ? "ring-2 ring-offset-1 ring-primary" : "hover:border-foreground/30"}`}
                      style={{ top, height: h, width: colW, left }}
                      onClick={(e) => openClusterPanel(
                        (e.currentTarget as HTMLElement).getBoundingClientRect(),
                        cluster,
                        dayIdx,
                        dayLabel
                      )}
                    >
                      {/* Encabezado neutro: recuento + hora. El COLOR vive en los chips de
                          cada alumno (mismo lenguaje que las tarjetas individuales). */}
                      <div className={`px-1 shrink-0 ${isComodo ? "pt-1 pb-0.5" : "pt-0.5"}`}>
                        <p className={`font-semibold leading-tight truncate text-foreground/80 ${isComodo ? "text-[12px]" : "text-[11px]"}`}>
                          {headerTitle}
                        </p>
                        {isComodo && (
                          <p className="text-[10px] text-muted-foreground tabular-nums leading-tight truncate">
                            {headerSubtitle}
                          </p>
                        )}
                      </div>

                      {/* Chips de alumno — cada uno en SU color, como mini-tarjetas apiladas.
                          Preview visual; el clic en el bloque abre el panel con la lista completa. */}
                      <div
                        className={`flex-1 min-h-0 overflow-hidden px-1 pb-1 flex flex-col ${
                          isComodo ? "gap-1 justify-center" : "gap-0.5"
                        }`}
                      >
                        {visibles.map((occ, oi) => {
                          const occColor = GROUP_COLORS[occ.colorIdx];
                          const occName = occ.group.is_individual && occ.group.primary_client?.full_name
                            ? occ.group.primary_client.full_name
                            : occ.group.name;
                          const occDiscipline = !clusterDisciplineLabel && occ.group.disciplines?.length
                            ? occ.group.disciplines.map((d) => d.name).join(" · ")
                            : null;

                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-1 rounded-sm border-l-2 ${occColor.bg} ${occColor.border} ${occColor.text} ${isComodo ? "px-1.5 py-0.5" : "px-1 py-px"}`}
                            >
                              <span className={`font-medium truncate leading-tight ${isComodo ? "text-[12px]" : "text-[10px]"}`}>
                                {occName}
                              </span>
                              {occDiscipline && isComodo && (
                                <span className="truncate opacity-70 leading-tight ml-auto shrink-0 max-w-[45%] text-[10px]">
                                  {occDiscipline}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {ocultos > 0 && (
                          <p className={`font-semibold text-primary leading-tight px-0.5 ${isComodo ? "text-[12px]" : "text-[10px]"}`}>
                            +{ocultos} más
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Overlay invisible — click fuera cierra el panel ── */}
      {(selected || clusterSel) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setSelected(null); setClusterSel(null); }}
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

      {/* ── Panel flotante del cluster — lista completa de ocupantes ── */}
      {clusterSel && (
        <ClusterPanel
          occupants={clusterSel.occupants}
          label={clusterSel.label}
          pos={clusterPanelPos}
          onClose={() => setClusterSel(null)}
          onNavigate={onNavigate ? (g) => { setClusterSel(null); onNavigate(g); } : undefined}
        />
      )}
    </div>
  );
}
