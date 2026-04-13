"use client";

// ============================================
// DATE PICKER - Selector de fecha en dd/mm/yyyy
// ============================================

import { useState } from "react";
import { format, parse, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  /** Valor en formato ISO YYYY-MM-DD */
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  // Convierte YYYY-MM-DD → Date
  const selected = value
    ? parse(value, "yyyy-MM-dd", new Date())
    : undefined;

  const validSelected = selected && isValid(selected) ? selected : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd")); // Siempre ISO al backend
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !validSelected && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {validSelected
            ? format(validSelected, "dd/MM/yyyy", { locale: es })
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={validSelected}
          onSelect={handleSelect}
          locale={es}
          captionLayout="dropdown"
          defaultMonth={validSelected ?? new Date()}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
