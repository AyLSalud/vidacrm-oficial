import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    // Allow all space-z.ai preview domains
    ".space-z.ai",
    "localhost",
  ],
};

export default nextConfig;
