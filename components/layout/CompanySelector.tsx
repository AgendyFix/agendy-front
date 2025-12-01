"use client";

// ============================================
// COMPANY SELECTOR - Switch between companies
// ============================================

import { useState } from "react";
import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/lib/hooks/useAuth";
import { cn } from "@/lib/utils";

export function CompanySelector() {
  const { user, currentCompany, switchCompany, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSwitchCompany = async (companyId: string) => {
    if (companyId === currentCompany?.id) {
      setOpen(false);
      return;
    }

    try {
      const selectedCompany = user?.companies.find(c => c.id === companyId);
      
      // Show loading toast
      const toastId = toast.loading(`Cambiando a ${selectedCompany?.name}...`);
      
      await switchCompany(companyId);
      
      // Dismiss loading and show success
      toast.dismiss(toastId);
      toast.success("Empresa cambiada exitosamente", {
        duration: 2000, // Show for 2 seconds before reload
      });
      
      setOpen(false);
    } catch (error) {
      toast.error("Error al cambiar de empresa");
    }
  };

  if (!user || !user.companies || user.companies.length === 0) {
    return null;
  }

  // Don't show selector if user only has one company
  if (user.companies.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Building2 className="h-4 w-4" />
        <span className="font-medium">{currentCompany?.name}</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
          disabled={isLoading}
        >
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{currentCompany?.name || "Seleccionar empresa"}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandList>
            <CommandEmpty>No se encontraron empresas.</CommandEmpty>
            <CommandGroup>
              {user.companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.id}
                  onSelect={(value) => handleSwitchCompany(value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentCompany?.id === company.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {company.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}