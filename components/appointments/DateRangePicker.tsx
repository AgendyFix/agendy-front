"use client";

// ============================================
// DATE RANGE PICKER - Visual date range selector
// ============================================

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  from: string; // Format: "YYYY-MM-DD"
  to: string;   // Format: "YYYY-MM-DD"
  onRangeChange: (from: string, to: string) => void;
}

export function DateRangePicker({ from, to, onRangeChange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  });
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
  };

  const handleApply = () => {
    if (date?.from && date?.to) {
      const fromStr = format(date.from, "yyyy-MM-dd");
      const toStr = format(date.to, "yyyy-MM-dd");
      onRangeChange(fromStr, toStr);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setDate(undefined);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date?.from ? (
            date.to ? (
              <>
                {format(date.from, "d 'de' MMM, yyyy", { locale: es })} -{" "}
                {format(date.to, "d 'de' MMM, yyyy", { locale: es })}
              </>
            ) : (
              format(date.from, "d 'de' MMM, yyyy", { locale: es })
            )
          ) : (
            <span>Seleccionar rango de fechas</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div>
          <Calendar
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={es}
          />
          <div className="p-3 border-t flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClear}
              className="flex-1"
            >
              Limpiar
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={!date?.from || !date?.to}
              className="flex-1"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}