import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output is needed for Docker/Railway deployments
  // Vercel ignores this setting and uses its own build system
  output: "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  // Only allow dev origins in development mode
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: [
      ".space-z.ai",
      "localhost",
    ],
  }),
};

export default nextConfig;
