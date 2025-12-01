"use client";

// ============================================
// MONTH SELECTOR - Visual month/year picker with dropdowns
// ============================================

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MonthSelectorProps {
  value: string; // Format: "YYYY-MM"
  onChange: (value: string) => void;
}

const months = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const [year, month] = value.split("-").map(Number);
  const [isOpen, setIsOpen] = useState(false);
  
  const currentDate = new Date(year, month - 1);
  const displayText = format(currentDate, "MMMM yyyy", { locale: es });

  // Generate years (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleMonthChange = (newMonth: string) => {
    const monthNum = parseInt(newMonth);
    const newValue = `${year}-${String(monthNum).padStart(2, "0")}`;
    onChange(newValue);
  };

  const handleYearChange = (newYear: string) => {
    const newValue = `${newYear}-${String(month).padStart(2, "0")}`;
    onChange(newValue);
  };

  const handleToday = () => {
    const now = new Date();
    const newValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[240px] justify-start gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span className="capitalize">{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Mes</label>
              <Select value={String(month)} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((monthName, index) => (
                    <SelectItem key={index} value={String(index + 1)}>
                      {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Año</label>
              <Select value={String(year)} onValueChange={handleYearChange}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleToday}
          >
            Mes Actual
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}