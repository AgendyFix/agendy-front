import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpilar paquetes de terceros que puedan usar syntax moderna
  // y no estén pre-transpilados para browsers viejos.
  transpilePackages: [
    "lucide-react",
    "sonner",
    "cmdk",
    "date-fns",
  ],
};

export default nextConfig;
