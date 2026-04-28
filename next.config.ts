import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "lucide-react",
    "sonner",
    "cmdk",
    "date-fns",
  ],
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
