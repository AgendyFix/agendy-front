"use client";

import { motion } from "motion/react";
import {
  Users,
  CreditCard,
  CalendarDays,
  Bell,
  GraduationCap,
  BarChart3,
} from "lucide-react";
import { SectionTracker } from "./SectionTracker";

const FEATURES = [
  {
    icon: Users,
    title: "Gestion de alumnos",
    description:
      "Directorio completo con datos de contacto, historial de pagos, asistencia y documentos. Todo accesible en un click.",
  },
  {
    icon: CreditCard,
    title: "Control de pagos",
    description:
      "Registra mensualidades, genera estados de cuenta y visualiza adeudos. Recibe notificaciones de pagos vencidos automaticamente.",
  },
  {
    icon: CalendarDays,
    title: "Horarios y clases grupales",
    description:
      "Organiza horarios por disciplina, salon y maestro. Tus alumnos saben exactamente cuando y donde es su clase.",
  },
  {
    icon: Bell,
    title: "Recordatorios por WhatsApp",
    description:
      "Envia recordatorios de pago, clase y avisos importantes directo al WhatsApp de tus alumnos. Sin esfuerzo manual.",
  },
  {
    icon: GraduationCap,
    title: "Inscripciones digitales",
    description:
      "Proceso de inscripcion fluido y sin papel. El alumno llena sus datos, elige su grupo y queda registrado al instante.",
  },
  {
    icon: BarChart3,
    title: "Reportes y metricas",
    description:
      "Dashboards en tiempo real: ingresos, alumnos activos, asistencia, desercion. Toma decisiones con datos, no con intuicion.",
  },
];

export function FeaturesSection() {
  return (
    <SectionTracker sectionId="features" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
            Todo lo que necesitas en un solo lugar
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Funcionalidades disenadas para academias de musica, danza, yoga, idiomas,
            artes marciales y cualquier espacio educativo.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-center h-11 w-11 rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/15 transition-colors">
                <feat.icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{feat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionTracker>
  );
}
