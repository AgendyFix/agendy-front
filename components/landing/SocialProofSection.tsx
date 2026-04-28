"use client";

import { motion } from "motion/react";
import { Music, Dumbbell, Palette, Languages, Swords, Heart } from "lucide-react";
import { SectionTracker } from "./SectionTracker";

const ACADEMY_TYPES = [
  { icon: Music, label: "Musica" },
  { icon: Heart, label: "Yoga y pilates" },
  { icon: Palette, label: "Artes y pintura" },
  { icon: Swords, label: "Artes marciales" },
  { icon: Languages, label: "Idiomas" },
  { icon: Dumbbell, label: "Danza y fitness" },
];

const TESTIMONIALS = [
  {
    quote:
      "Antes tardaba horas cobrando por WhatsApp. Ahora todo esta automatizado y mis alumnos reciben recordatorios solos.",
    author: "Carolina M.",
    role: "Directora, Academia de Danza",
  },
  {
    quote:
      "Por fin tengo visibilidad de cuantos alumnos activos tengo, quien debe y cuanto ingreso genero cada mes.",
    author: "Roberto F.",
    role: "Fundador, Escuela de Musica",
  },
  {
    quote:
      "La migracion fue super sencilla. El equipo de AgendyFix configuro todo y en una semana ya estabamos operando.",
    author: "Ana L.",
    role: "Coordinadora, Centro de Idiomas",
  },
];

export function SocialProofSection() {
  return (
    <SectionTracker sectionId="social-proof" className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        {/* Academy types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
            Disenado para todo tipo de academias
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
            Sin importar tu disciplina, AgendyFix se adapta a la forma en que operas.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {ACADEMY_TYPES.map((type, i) => (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
              >
                <type.icon className="h-4 w-4 text-primary" />
                {type.label}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((item, i) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="h-4 w-4 text-primary fill-primary"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.author}</p>
                <p className="text-xs text-muted-foreground">{item.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionTracker>
  );
}
