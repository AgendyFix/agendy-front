// ============================================
// NOTIFICATIONS PROVIDER - AgendyFix
// Initializes notifications hook once at app level
// ============================================

"use client";

import { useNotifications } from "@/lib/hooks/useNotifications";
import { useEffect } from "react";

export const NotificationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Initialize notifications hook once
  useNotifications();

  return <>{children}</>;
};
