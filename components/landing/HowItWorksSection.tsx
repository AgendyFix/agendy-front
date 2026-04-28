"use client";

import { motion } from "motion/react";
import { MessageCircle, UserPlus, Settings, Rocket } from "lucide-react";
import { SectionTracker } from "./SectionTracker";
import { buildWaUrl, trackWaClick } from "@/lib/tracking";

const WA_MSG =
  "Hola, quiero agendar una demo de AgendyFix para mi academia.";

const STEPS = [
  {
    icon: MessageCircle,
    number: "01",
    title: "Contactanos",
    description:
      "Platícanos sobre tu academia por WhatsApp. Entendemos tu operacion y tus necesidades especificas.",
  },
  {
    icon: Settings,
    number: "02",
    title: "Configuramos tu cuenta",
    description:
      "Nuestro equipo configura tu academia: disciplinas, grupos, horarios y alumnos. Tu solo nos das la informacion.",
  },
  {
    icon: UserPlus,
    number: "03",
    title: "Migra tu operacion",
    description:
      "Importamos tus alumnos actuales, configuramos recordatorios y dejamos todo listo para que empieces a usar el sistema.",
  },
  {
    icon: Rocket,
    number: "04",
    title: "Crece con datos",
    description:
      "Con todo centralizado, tomas mejores decisiones. Reduces desercion, cobras a tiempo y escalas tu academia.",
  },
];

export function HowItWorksSection() {
  return (
    <SectionTracker
      sectionId="how-it-works"
      className="py-16 md:py-24 bg-muted/30"
    >
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
            Empezar es mas facil de lo que piensas
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            No necesitas ser experto en tecnologia. Nuestro equipo te acompana en
            cada paso para que la transicion sea suave.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative"
            >
              <div className="rounded-2xl border border-border bg-card p-6 h-full">
                <span className="text-4xl font-extrabold text-primary/15 block mb-3">
                  {step.number}
                </span>
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-secondary/10 text-secondary mb-3">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10"
        >
          <a
            href={buildWaUrl(WA_MSG)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackWaClick("how_it_works")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <MessageCircle className="h-4.5 w-4.5" />
            Agenda tu demo gratuita
          </a>
        </motion.div>
      </div>
    </SectionTracker>
  );
}
