import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Calendar, Clock, ArrowRight } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.agendyfix.com";

export const metadata: Metadata = {
  title: "Blog — Gestión de Citas, Servicios y Negocios | AgendyFix",
  description:
    "Guías prácticas para empresas de servicios: gestión de citas, retención de clientes, automatización con WhatsApp, recordatorios y estrategias para hacer crecer tu negocio.",
  keywords: [
    "gestión de citas",
    "agenda de servicios",
    "software para negocios de servicios",
    "recordatorios WhatsApp",
    "retención de clientes",
    "automatización de agenda",
    "AgendyFix blog",
    "negocio de servicios",
    "academia de música",
    "estudio de yoga",
    "barbería gestión",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: `${siteUrl}/blog`,
    siteName: "AgendyFix",
    title: "Blog — Gestión de Citas y Servicios | AgendyFix",
    description:
      "Guías prácticas para empresas de servicios. Aprende a gestionar citas, retener clientes, automatizar recordatorios y hacer crecer tu negocio.",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "AgendyFix Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — Gestión de Citas y Servicios | AgendyFix",
    description:
      "Guías prácticas para empresas de servicios: gestión de citas, retención de clientes y automatización.",
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Blog",
        name: "Blog de AgendyFix",
        description:
          "Guías prácticas para empresas de servicios en Latinoamérica.",
        url: `${siteUrl}/blog`,
        publisher: {
          "@type": "Organization",
          name: "AgendyFix",
          url: siteUrl,
        },
        inLanguage: "es-MX",
      },
      {
        "@type": "ItemList",
        itemListElement: posts.slice(0, 10).map((post, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${siteUrl}/blog/${post.slug}`,
          name: post.title,
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary via-secondary/80 to-accent pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="mx-auto max-w-4xl px-4 md:px-6">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Blog de AgendyFix
          </h1>
          <p className="text-white/85 text-lg md:text-xl max-w-2xl leading-relaxed">
            Guías prácticas para gestionar tu negocio de servicios: citas,
            clientes, automatización con WhatsApp y estrategias de crecimiento.
          </p>
        </div>
      </section>

      {/* Post List */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-4xl px-4 md:px-6 space-y-5">
          {posts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">
                Pronto publicaremos contenido. ¡Vuelve pronto!
              </p>
            </div>
          )}

          {posts.map((post, index) => (
            <div key={post.slug}>
              {/* Mid-list CTA */}
              {index === 3 && (
                <div className="rounded-2xl bg-gradient-to-br from-secondary via-secondary/80 to-accent border border-accent/40 p-6 md:p-8 text-center mb-5">
                  <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">
                    Deja de perder clientes por no dar seguimiento
                  </h3>
                  <p className="text-white/85 mb-5 max-w-lg mx-auto text-sm leading-relaxed">
                    Centraliza tu agenda, envía recordatorios automáticos por
                    WhatsApp y haz que tus clientes regresen.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-white text-secondary font-bold px-6 py-3 text-sm hover:bg-white/90 transition-colors"
                  >
                    Probar gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              <Link href={`/blog/${post.slug}`} className="block group">
                <article className="rounded-2xl border border-border bg-card p-5 md:p-6 hover:border-primary/40 hover:shadow-md transition-all">
                  {/* Date + Reading time */}
                  <div className="flex items-center gap-4 mb-3 text-muted-foreground text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.date).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readingTime} de lectura
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2 leading-tight">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4 line-clamp-3">
                    {post.description}
                  </p>

                  {/* Keywords + Arrow */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {post.keywords.slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <ArrowRight className="h-4 w-4 text-primary shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </article>
              </Link>
            </div>
          ))}

          {/* Bottom CTA */}
          {posts.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-secondary via-secondary/80 to-accent border border-accent/40 p-6 md:p-8 text-center mt-8">
              <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2">
                Pon en práctica lo que leíste
              </h3>
              <p className="text-white/85 mb-5 max-w-md mx-auto text-sm leading-relaxed">
                Registra tu negocio, organiza tu agenda y envía recordatorios
                automáticos a tus clientes en minutos.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-secondary font-bold px-6 py-3 text-sm hover:bg-white/90 transition-colors"
              >
                Empezar gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
