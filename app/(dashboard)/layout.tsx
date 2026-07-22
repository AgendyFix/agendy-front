// ============================================
// DASHBOARD LAYOUT - Protected layout with sidebar and header
// ============================================

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AccountBanner } from "@/components/layout/AccountBanner";
import { AccessSuspendedOverlay } from "@/components/layout/AccessSuspendedOverlay";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { FeaturesProvider } from "@/components/features/FeaturesProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <FeaturesProvider>
        <NotificationsProvider>
          <div className="flex h-screen flex-col">
            <Header />
            <AccountBanner />
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
            <AccessSuspendedOverlay />
          </div>
        </NotificationsProvider>
      </FeaturesProvider>
    </ProtectedRoute>
  );
}