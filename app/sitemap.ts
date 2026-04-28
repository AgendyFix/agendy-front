import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.agendyfix.com";
  const now = new Date().toISOString();

  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getAllPosts } = require("@/lib/blog");
    const posts = getAllPosts();
    blogPosts = posts.map(
      (post: { slug: string; lastModified?: string; date: string }) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        lastModified: new Date(post.lastModified || post.date),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[sitemap] Could not load blog posts:", error);
    }
  }

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...blogPosts,
  ];
}
