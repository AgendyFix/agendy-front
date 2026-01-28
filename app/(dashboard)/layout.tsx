// ============================================
// DASHBOARD LAYOUT - Protected layout with sidebar and header
// ============================================

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
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
            <div className="flex flex-1 overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto p-6">
                {children}
              </main>
            </div>
          </div>
        </NotificationsProvider>
      </FeaturesProvider>
    </ProtectedRoute>
  );
}