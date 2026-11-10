"use client";

// ============================================
// DAY AGENDA - Horarios en celular: chips de día + lista de clases
// ============================================

import { useState } from "react";
import { Calendar, ChevronRight, Users } from "lucide-react";
import type { ClassGroup } from "@/lib/types/models";
import { DAYS_FULL, GROUP_COLORS, to12h } from "@/components/schedule/WeeklyCalendar";

const DAYS_CHIP = ["L", "M", "M", "J", "V", "S", "D"];

interface DayAgendaProps {
  groups: ClassGroup[];
  colorMap: Record<string, number>;
  onNavigate: (group: ClassGroup) => void;
}

export function DayAgenda({ groups, colorMap, onNavigate }: DayAgendaProps) {
  // day_of_week: 0 = lunes … 6 = domingo; Date.getDay(): 0 = domingo
  const today = (new Date().getDay() + 6) % 7;
  const [day, setDay] = useState(today);

  const countByDay = DAYS_CHIP.map((_, d) =>
    groups.reduce((n, g) => n + g.schedules.filter((s) => s.day_of_week === d).length, 0)
  );

  const classes = groups
    .flatMap((g) => g.schedules.filter((s) => s.day_of_week === day).map((s) => ({ group: g, schedule: s })))
    .sort((a, b) => a.schedule.start_time.localeCompare(b.schedule.start_time));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Día de la semana">
        {DAYS_CHIP.map((label, d) => {
          const active = d === day;
          return (
            <button
              key={d}
              aria-pressed={active}
              aria-current={d === today ? "date" : undefined}
              aria-label={`${DAYS_FULL[d]}${countByDay[d] ? `, ${countByDay[d]} clases` : ", sin clases"}`}
              onClick={() => setDay(d)}
              className={`flex h-12 flex-col items-center justify-center rounded-lg border text-sm font-semibold transition-colors
                ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background text-foreground"}
                ${d === today && !active ? "border-primary" : ""}`}
            >
              {label}
              <span
                className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                  countByDay[d] > 0 ? (active ? "bg-primary-foreground" : "bg-primary") : "bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>

      <p className="text-sm font-medium">
        {DAYS_FULL[day]}
        {day === today && <span className="text-muted-foreground font-normal"> · hoy</span>}
      </p>

      {classes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border py-10 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Sin clases este día</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {classes.map(({ group, schedule }) => {
            const color = GROUP_COLORS[colorMap[group.id] ?? 0];
            const name = group.is_individual && group.primary_client?.full_name
              ? group.primary_client.full_name
              : group.name;
            return (
              <li key={`${group.id}-${schedule.id}`}>
                <button
                  onClick={() => onNavigate(group)}
                  className={`flex w-full items-center gap-3 rounded-lg border-l-4 ${color.border} border bg-card p-3 text-left`}
                >
                  <div className="w-16 shrink-0 text-xs leading-tight">
                    <p className="font-semibold">{to12h(schedule.start_time)}</p>
                    <p className="text-muted-foreground">{to12h(schedule.end_time)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{name}</p>
                    <p className="flex items-center gap-2 truncate text-xs text-muted-foreground">
                      {group.instructor_name && <span className="truncate">{group.instructor_name}</span>}
                      <span className="flex items-center gap-1 shrink-0">
                        <Users className="h-3 w-3" />
                        {group.active_enrollment_count}
                      </span>
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
