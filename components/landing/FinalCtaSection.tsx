"use client";

import { motion } from "motion/react";
import { MessageCircle, ArrowRight } from "lucide-react";
import { SectionTracker } from "./SectionTracker";
import { buildWaUrl, trackWaClick, trackEvent } from "@/lib/tracking";

const WA_MSG =
  "Hola, quiero agendar una demo de AgendyFix para mi academia. Me gustaria conocer precios y funcionalidades.";

export function FinalCtaSection() {
  return (
    <SectionTracker sectionId="final-cta">
      <div className="relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/95 to-accent/60 py-16 md:py-24">
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

        <div className="relative mx-auto max-w-3xl px-4 md:px-6 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-2xl md:text-4xl font-extrabold text-white mb-4"
          >
            Deja de improvisar.{" "}
            <span className="text-primary">Profesionaliza tu academia.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed"
          >
            Habla con nuestro equipo, te mostramos como AgendyFix puede
            transformar la operacion de tu academia en menos de una semana.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <a
              href={buildWaUrl(WA_MSG)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackWaClick("final_cta")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-4 text-base font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              <MessageCircle className="h-5 w-5" />
              Agenda una demo gratuita
            </a>
            <a
              href="/blog"
              onClick={() =>
                trackEvent("cta_click", { location: "final_cta", type: "blog" })
              }
              className="inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Leer nuestro blog
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </div>
    </SectionTracker>
  );
}
