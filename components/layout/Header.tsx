"use client";

// ============================================
// HEADER - Top navigation bar
// ============================================

import Image from "next/image";
import { Menu } from "lucide-react";
import { CompanySelector } from "./CompanySelector";
import { UserMenu } from "./UserMenu";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/lib/hooks/useAuth";
import { useUIStore } from "@/lib/stores/uiStore";
import { Button } from "@/components/ui/button";

export function Header() {
  const { user, currentCompany } = useAuth();
  const { openSidebar } = useUIStore();
  
  // Obtener el rol del usuario para la company actual
  const currentRole = user?.employee_profiles?.find(
    (profile) => profile.company === currentCompany?.id
  )?.role;
  
  const roleText = currentRole === "admin" ? "Administrador" : "Operador";

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Hamburger menu en móvil */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={openSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 md:gap-3">
            <Image
              src="/logo.png"
              alt="AgendyFix Logo"
              width={40}
              height={40}
              className="h-8 w-8 md:h-10 md:w-10 object-contain"
            />
            <h1 className="text-lg md:text-xl font-bold">AgendyFix</h1>
          </div>
          
          <div className="hidden md:block">
            <CompanySelector />
          </div>
          
          {currentRole && (
            <span className="hidden md:inline text-sm text-muted-foreground">
              • {roleText}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}