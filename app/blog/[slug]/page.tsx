import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import MarkdownContent from "@/components/blog/MarkdownContent";
import { Calendar, Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { BlogTracker } from "@/components/blog/BlogTracker";
import { BlogCta } from "@/components/blog/BlogCta";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.agendyfix.com";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: `${post.title} | AgendyFix Blog`,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      locale: "es_MX",
      url: `${siteUrl}/blog/${slug}`,
      siteName: "AgendyFix",
      title: `${post.title} | AgendyFix`,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.lastModified || post.date,
      images: [
        {
          url: post.coverImage || "/logo.png",
          width: 1200,
          height: 630,
          alt: post.coverImageAlt || `${post.title} | AgendyFix`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | AgendyFix`,
      description: post.description,
      images: [post.coverImage || "/logo.png"],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Related posts by keyword overlap
  const otherPosts = getAllPosts().filter((p) => p.slug !== slug);
  const postKeywords = new Set(
    post.keywords.map((k: string) => k.toLowerCase())
  );
  const scored = otherPosts.map((p) => {
    const overlap = (p.keywords || []).filter((k: string) =>
      postKeywords.has(k.toLowerCase())
    ).length;
    return { post: p, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  const relatedPosts = scored.slice(0, 3).map((s) => s.post);

  // JSON-LD
  const articleJsonLd: Record<string, unknown> = {
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: post.coverImage
      ? `${siteUrl}${post.coverImage}`
      : `${siteUrl}/logo.png`,
    datePublished: post.date,
    dateModified: post.lastModified || post.date,
    author: { "@type": "Organization", name: "AgendyFix", url: siteUrl },
    publisher: {
      "@type": "Organization",
      name: "AgendyFix",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
    mainEntityOfPage: `${siteUrl}/blog/${slug}`,
    keywords: post.keywords.join(", "),
    inLanguage: "es-MX",
  };

  const graphItems: Record<string, unknown>[] = [articleJsonLd];

  if (post.faqs.length > 0) {
    graphItems.push({
      "@type": "FAQPage",
      mainEntity: post.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    });
  }

  const combinedJsonLd = {
    "@context": "https://schema.org",
    "@graph": graphItems,
  };

  // Split content at section boundaries for inline CTA
  const sections = post.content.split(/(?=^## )/m);
  const midpoint = Math.floor(sections.length / 2);
  const firstHalf = sections.slice(0, Math.max(1, midpoint)).join("");
  const secondHalf = sections.slice(Math.max(1, midpoint)).join("");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedJsonLd) }}
      />
      <BlogTracker slug={slug} title={post.title} keywords={post.keywords} />

      <article className="py-8 md:py-12">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al blog
          </Link>

          {/* Header */}
          <header className="mb-8">
            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.keywords.slice(0, 4).map((kw) => (
                <span
                  key={kw}
                  className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium"
                >
                  {kw}
                </span>
              ))}
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-foreground leading-tight mb-4">
              {post.title}
            </h1>

            <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-4">
              {post.description}
            </p>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
          </header>

          {/* Cover image */}
          {post.coverImage && (
            <div className="mb-8 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Content first half */}
          <div className="prose-agendyfix">
            <MarkdownContent content={firstHalf} />
          </div>

          {/* Inline CTA */}
          <div className="my-10">
            <BlogCta variant="mid" />
          </div>

          {/* Content second half */}
          <div className="prose-agendyfix">
            <MarkdownContent content={secondHalf} />
          </div>

          {/* Related posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-12 pt-8 border-t border-border">
              <h2 className="text-xl font-bold text-foreground mb-5">
                Artículos relacionados
              </h2>
              <div className="space-y-3">
                {relatedPosts.map((related) => (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="block group"
                  >
                    <div className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {related.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>
    </>
  );
}
