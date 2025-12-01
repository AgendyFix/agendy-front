"use client";

// ============================================
// SIDEBAR - Navigation menu (Responsive)
// ============================================

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  UsersRound,
  UserCog,
  X
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Citas",
    href: "/appointments",
    icon: Calendar,
  },
  {
    name: "Clientes",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Servicios",
    href: "/services",
    icon: Briefcase,
  },
  {
    name: "Equipos",
    href: "/teams",
    icon: UsersRound,
  },
  {
    name: "Empleados",
    href: "/employees",
    icon: UserCog,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useUIStore();

  return (
    <>
      {/* Overlay en móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 border-r bg-background transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Botón cerrar en móvil */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b">
          <span className="font-semibold">Menú</span>
          <Button variant="ghost" size="icon" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-col gap-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-agendyfix px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-accent/20 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        </nav>
      </aside>
    </>
  );
}