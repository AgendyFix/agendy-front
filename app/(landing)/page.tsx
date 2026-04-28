import { HeroSection } from "@/components/landing/HeroSection";
import { PainPointsSection } from "@/components/landing/PainPointsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FinalCtaSection } from "@/components/landing/FinalCtaSection";
import { ScrollDepthTracker } from "@/components/landing/ScrollDepthTracker";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.agendyfix.com";

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "AgendyFix",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description:
          "Software de gestion para academias y escuelas. Centraliza alumnos, inscripciones, pagos, clases grupales y recordatorios por WhatsApp.",
        url: siteUrl,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "MXN",
          description: "Prueba gratuita disponible",
        },
      },
      {
        "@type": "Organization",
        name: "AgendyFix",
        url: siteUrl,
        logo: `${siteUrl}/logo.png`,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+52-56-6771-4084",
          contactType: "sales",
          availableLanguage: "es",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ScrollDepthTracker />
      <HeroSection />
      <PainPointsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <FinalCtaSection />
    </>
  );
}
