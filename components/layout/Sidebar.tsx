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
  CalendarDays,
  UserCog,
  Bell,
  X,
  GraduationCap,
  CreditCard,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/uiStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFeatures } from "@/lib/hooks/useFeatures";
import { Button } from "@/components/ui/button";

const navigation = [
  {
    name: "Dashboard",
    href: "/home",
    icon: LayoutDashboard,
    adminOnly: true,
    featureFlag: "metabase_analytics",
  },
  {
    name: "Horarios",
    href: "/schedule",
    icon: CalendarDays,
    featureFlag: "class_management",
    fixedName: true,
  },
  {
    name: "Citas",
    href: "/appointments",
    icon: Calendar,
    featureFlag: "appointments",
  },
  {
    name: "Clientes",
    href: "/clients",
    icon: Users,
    featureFlag: "client_groups",
  },
  {
    name: "Servicios",
    href: "/services",
    icon: Briefcase,
    featureFlag: "appointments",
  },
  {
    name: "Instructores",
    href: "/employees",
    icon: UserCog,
    featureFlag: "class_management",
    fixedName: true,
  },
  {
    name: "Recordatorios",
    href: "/reminders",
    icon: Bell,
    featureFlag: "reminders",
  },
  {
    name: "Grupos / Clases",
    href: "/class-groups",
    icon: GraduationCap,
    featureFlag: "class_management",
  },
  {
    name: "Pagos",
    href: "/payments",
    icon: CreditCard,
    featureFlag: "payment_tracking",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useUIStore();
  const { user, currentCompany } = useAuth();
  const { isFeatureEnabled, getFeatureName } = useFeatures();

  const currentRole = user?.employee_profiles?.find(
    (profile) => profile.company === currentCompany?.id
  )?.role;

  const isAdmin = currentRole === "admin";

  const visibleNavigation = navigation.filter((item) => {
    // Check admin permission
    if (item.adminOnly && !isAdmin) {
      return false;
    }
    
    // Check feature flag
    if (item.featureFlag && !isFeatureEnabled(item.featureFlag)) {
      return false;
    }
    
    return true;
  });

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
          {visibleNavigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            // Si fixedName está activo, usa siempre el nombre hardcodeado
            // Si no, intenta usar el nombre del feature flag del API
            const label = item.fixedName
              ? item.name
              : (item.featureFlag && getFeatureName(item.featureFlag)) || item.name;

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
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}