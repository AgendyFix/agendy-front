"use client";

import { motion } from "motion/react";
import { ArrowRight, MessageCircle, CheckCircle } from "lucide-react";
import { SectionTracker } from "./SectionTracker";
import { buildWaUrl, trackWaClick, trackEvent } from "@/lib/tracking";

const WA_MSG =
  "Hola, me interesa AgendyFix para mi academia. Quiero agendar una demo.";

const HIGHLIGHTS = [
  "Gestion de alumnos e inscripciones",
  "Control de pagos y mensualidades",
  "Recordatorios automaticos por WhatsApp",
  "Clases grupales y horarios",
];

export function HeroSection() {
  return (
    <SectionTracker sectionId="hero">
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/95 to-accent/60 pt-20 pb-16 md:pt-28 md:pb-24">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 mb-6 backdrop-blur-sm">
                  Software para academias y escuelas
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-5"
              >
                Tu academia merece un sistema que trabaje{" "}
                <span className="text-primary">por ti</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-lg"
              >
                Deja de cobrar por WhatsApp, apuntar alumnos en hojas de calculo y
                perder inscripciones. AgendyFix centraliza todo en un solo lugar
                para que te enfoques en ensenar.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-3 mb-10"
              >
                <a
                  href={buildWaUrl(WA_MSG)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackWaClick("hero")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
                >
                  <MessageCircle className="h-4.5 w-4.5" />
                  Habla con un asesor
                </a>
                <a
                  href="#features"
                  onClick={() =>
                    trackEvent("cta_click", { location: "hero", type: "secondary" })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors border border-white/20"
                >
                  Ver funcionalidades
                  <ArrowRight className="h-4 w-4" />
                </a>
              </motion.div>

              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="space-y-2"
              >
                {HIGHLIGHTS.map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-2.5 text-sm text-white/75"
                  >
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            {/* Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hidden lg:flex justify-center"
            >
              <div className="relative w-full max-w-md">
                <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 shadow-2xl">
                  <div className="space-y-4">
                    {/* Mock dashboard header */}
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/30 flex items-center justify-center">
                        <div className="h-5 w-5 rounded-full bg-primary" />
                      </div>
                      <div>
                        <div className="h-3 w-32 bg-white/30 rounded" />
                        <div className="h-2 w-20 bg-white/20 rounded mt-1.5" />
                      </div>
                    </div>
                    {/* Mock stats */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "Alumnos", value: "148" },
                        { label: "Pagos", value: "$42k" },
                        { label: "Clases", value: "36" },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-xl bg-white/10 p-3 text-center"
                        >
                          <p className="text-lg font-bold text-white">
                            {stat.value}
                          </p>
                          <p className="text-xs text-white/60">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    {/* Mock list */}
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-lg bg-white/5 p-3"
                      >
                        <div className="h-8 w-8 rounded-full bg-white/15" />
                        <div className="flex-1">
                          <div className="h-2.5 w-24 bg-white/25 rounded" />
                          <div className="h-2 w-16 bg-white/15 rounded mt-1" />
                        </div>
                        <div className="h-6 w-16 rounded-full bg-primary/40" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </SectionTracker>
  );
}
