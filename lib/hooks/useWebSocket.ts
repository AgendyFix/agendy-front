// ============================================
// WEBSOCKET HOOK - AgendyFix
// Manages WebSocket connection with auto-reconnect
// ============================================

"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { getAccessToken } from "@/lib/api/client";
import type { WSMessage } from "@/lib/types/models";

interface UseWebSocketOptions {
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  reconnectAttempts: number;
  disconnect: () => void;
  reconnect: () => void;
}

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export const useWebSocket = ({
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  enabled = true,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const shouldReconnectRef = useRef(true);
  const mountedRef = useRef(false);
  
  // Use refs for callbacks to avoid recreating connect function
  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  
  // Update refs when callbacks change
  useEffect(() => {
    onMessageRef.current = onMessage;
    onConnectRef.current = onConnect;
    onDisconnectRef.current = onDisconnect;
    onErrorRef.current = onError;
  }, [onMessage, onConnect, onDisconnect, onError]);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearReconnectTimeout();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, [clearReconnectTimeout]);

  const connect = useCallback(() => {
    // Don't connect if disabled, already connected, or already connecting
    if (!enabled ||
        wsRef.current?.readyState === WebSocket.OPEN ||
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.warn("[WebSocket] No access token available");
      return;
    }

    try {
      // Encode token to avoid URL length issues
      const encodedToken = encodeURIComponent(token);
      const wsUrl = `${WS_BASE_URL}/ws/notifications/?token=${encodedToken}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
        setReconnectAttempts(0);
        shouldReconnectRef.current = true;
        onConnectRef.current?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          onMessageRef.current?.(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      ws.onerror = () => {
        // Silenced - empty errors are normal during WebSocket connection
        // Only log if there's actual error data
      };

      ws.onclose = (event) => {
        console.log("[WebSocket] Disconnected", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        onDisconnectRef.current?.();

        // Handle specific close codes
        if (event.code === 4001) {
          console.warn("[WebSocket] Token invalid/expired");
          shouldReconnectRef.current = false;
          return;
        } else if (event.code === 4003) {
          console.warn("[WebSocket] No company selected");
          shouldReconnectRef.current = false;
          return;
        }

        // Normal close, don't reconnect
        if (event.code === 1000 || event.code === 1001) {
          return;
        }

        // Auto-reconnect logic - only if still mounted
        if (shouldReconnectRef.current && enabled && mountedRef.current) {
          setReconnectAttempts((prev) => {
            const nextAttempt = prev + 1;
            
            if (nextAttempt <= maxReconnectAttempts) {
              clearReconnectTimeout();
              reconnectTimeoutRef.current = setTimeout(() => {
                console.log(
                  `[WebSocket] Reconnecting... (attempt ${nextAttempt}/${maxReconnectAttempts})`
                );
                connect();
              }, reconnectInterval);
            } else {
              console.error("[WebSocket] Max reconnect attempts reached");
            }
            
            return nextAttempt;
          });
        }
      };
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
    }
  }, [
    enabled,
    maxReconnectAttempts,
    reconnectInterval,
    clearReconnectTimeout,
  ]);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectAttempts(0);
    shouldReconnectRef.current = true;
    setTimeout(connect, 100);
  }, [disconnect, connect]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    if (enabled) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      shouldReconnectRef.current = false;
      clearReconnectTimeout();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]); // Only reconnect when enabled changes

  return {
    isConnected,
    reconnectAttempts,
    disconnect,
    reconnect,
  };
};
