import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.agendyfix.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/blog", "/blog/"],
        disallow: [
          "/login",
          "/appointments",
          "/clients",
          "/services",
          "/teams",
          "/employees",
          "/reminders",
          "/schedule",
          "/payments",
          "/enrollments",
          "/class-groups",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
