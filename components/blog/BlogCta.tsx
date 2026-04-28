"use client";

import { MessageCircle, ArrowRight } from "lucide-react";
import { buildWaUrl, trackWaClick, trackEvent } from "@/lib/tracking";

interface Props {
  variant?: "mid" | "bottom";
}

const WA_MSG_MID =
  "Hola, estuve leyendo su blog y me interesa conocer AgendyFix para mi academia.";
const WA_MSG_BOTTOM =
  "Hola, quiero probar AgendyFix para mi academia. Vi su blog y me intereso.";

const CONTENT = {
  mid: {
    title: "Administra tu academia sin complicaciones",
    description:
      "Centraliza alumnos, inscripciones, pagos y clases grupales. Envia recordatorios por WhatsApp. Empieza en minutos.",
    cta: "Habla con un asesor",
    waMsg: WA_MSG_MID,
  },
  bottom: {
    title: "Pon en practica lo que leiste",
    description:
      "Registra tu academia, organiza tus grupos y envia recordatorios automaticos a tus alumnos.",
    cta: "Agenda tu demo gratuita",
    waMsg: WA_MSG_BOTTOM,
  },
};

export function BlogCta({ variant = "mid" }: Props) {
  const { title, description, cta, waMsg } = CONTENT[variant];

  const handleClick = () => {
    trackWaClick(`blog_${variant}`);
    trackEvent("blog_cta_click", { variant, buttonText: cta });
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-secondary via-secondary/80 to-accent border border-accent/40 p-6 md:p-8 text-center">
      <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">
        {title}
      </h3>
      <p className="text-white/85 mb-5 max-w-lg mx-auto text-sm leading-relaxed">
        {description}
      </p>
      <a
        href={buildWaUrl(waMsg)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-xl bg-white text-secondary font-bold px-6 py-3 text-sm hover:bg-white/90 transition-colors"
      >
        <MessageCircle className="h-4 w-4" />
        {cta}
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}
