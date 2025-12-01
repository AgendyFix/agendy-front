"use client";

// ============================================
// PROTECTED ROUTE - Client-side route protection
// ============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { getAccessToken } from "@/lib/api/client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, fetchProfile, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();

      if (!token) {
        router.push("/login");
        return;
      }

      if (!isAuthenticated) {
        try {
          await fetchProfile();
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          router.push("/login");
          return;
        }
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, fetchProfile, router]);

  if (isChecking || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}