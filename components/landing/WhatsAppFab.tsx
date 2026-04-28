"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X } from "lucide-react";
import { buildWaUrl, trackWaClick } from "@/lib/tracking";

const WA_MSG =
  "Hola, me interesa AgendyFix para gestionar mi academia. Me gustaria agendar una demo.";

export function WhatsAppFab() {
  const [showTooltip, setShowTooltip] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissed) setShowTooltip(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  useEffect(() => {
    if (showTooltip) {
      const hide = setTimeout(() => setShowTooltip(false), 8000);
      return () => clearTimeout(hide);
    }
  }, [showTooltip]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {showTooltip && !dismissed && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="relative bg-foreground text-background rounded-xl px-4 py-3 text-sm max-w-[240px] shadow-lg"
          >
            <button
              onClick={() => setDismissed(true)}
              className="absolute -top-2 -right-2 bg-muted text-muted-foreground rounded-full p-0.5 hover:bg-muted/80 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="font-medium leading-snug">
              Agenda una demo con nuestro equipo
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={buildWaUrl(WA_MSG)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackWaClick("fab")}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center h-14 w-14 rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40 transition-shadow"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle className="h-6 w-6" />
      </motion.a>
    </div>
  );
}
