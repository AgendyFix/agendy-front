"use client";

import { motion } from "motion/react";
import {
  FileSpreadsheet,
  MessageSquareWarning,
  UserMinus,
  ChartNoAxesCombined,
} from "lucide-react";
import { SectionTracker } from "./SectionTracker";

const PAINS = [
  {
    icon: FileSpreadsheet,
    title: "Inscripciones en papel o Excel",
    description:
      "Hojas de calculo, libretas y grupos de WhatsApp que se descontrolan cada inicio de mes. Pierdes alumnos por no tener un proceso claro.",
  },
  {
    icon: MessageSquareWarning,
    title: "Cobros manuales y sin control",
    description:
      "No sabes quien ya pago, quien debe y cuanto se te queda pendiente. Los recordatorios de pago los mandas tu a mano.",
  },
  {
    icon: UserMinus,
    title: "Desercion silenciosa",
    description:
      "Alumnos dejan de venir sin que te des cuenta. No tienes forma de medir asistencia ni de reaccionar a tiempo.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Cero visibilidad de tu negocio",
    description:
      "No sabes cuantos alumnos activos tienes, cual es tu ingreso mensual ni que clases tienen mayor demanda.",
  },
];

export function PainPointsSection() {
  return (
    <SectionTracker sectionId="pain-points" className="py-16 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
            Estos problemas te suenan familiares
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            La mayoria de las academias pierden tiempo, dinero y alumnos por no tener
            un sistema que los ayude a organizar su operacion.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {PAINS.map((pain, i) => (
            <motion.div
              key={pain.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-destructive/30 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-destructive/10 text-destructive">
                  <pain.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-1.5">
                    {pain.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pain.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionTracker>
  );
}
