// ============================================
// NOTIFICATION BELL - AgendyFix
// Bell icon with badge showing unread count
// ============================================

"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NotificationPanel } from "./NotificationPanel";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { useEffect, useState, useRef } from "react";

export const NotificationBell = () => {
  const { unreadCount } = useNotificationStore();
  const [shake, setShake] = useState(false);
  const prevCountRef = useRef(unreadCount);

  // Animate bell when new notification arrives
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setShake(true);
      setTimeout(() => setShake(false), 1000);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell
            className={`h-5 w-5 transition-transform ${
              shake ? "animate-[wiggle_0.5s_ease-in-out]" : ""
            }`}
          />
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 animate-ping opacity-75" />
            </>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <NotificationPanel />
      </PopoverContent>
    </Popover>
  );
};
