import type { Metadata } from "next";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { WhatsAppFab } from "@/components/landing/WhatsAppFab";

export const metadata: Metadata = {
  title: "AgendyFix — Software de gestion para academias y escuelas",
  description:
    "Centraliza alumnos, inscripciones, pagos y clases grupales. Envia recordatorios automaticos por WhatsApp. El software que tu academia necesita para crecer.",
  keywords: [
    "software para academias",
    "gestion de academias",
    "control de alumnos",
    "inscripciones academia",
    "pagos academia",
    "clases grupales",
    "recordatorios WhatsApp",
    "software escuela de musica",
    "academia de danza",
    "estudio de yoga",
    "artes marciales gestion",
  ],
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://app.agendyfix.com",
    siteName: "AgendyFix",
    title: "AgendyFix — Software de gestion para academias",
    description:
      "Centraliza alumnos, inscripciones, pagos y clases grupales. El software que tu academia necesita para crecer.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "AgendyFix",
      },
    ],
  },
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <LandingNavbar />
      <main className="flex-1">{children}</main>
      <LandingFooter />
      <WhatsAppFab />
    </div>
  );
}
