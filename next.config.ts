import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  images: {
    // Cap the largest generated variant at 2048 (was 3840). No source in the
    // project exceeds 2400px, so 3840 only ever triggered needless full-size
    // re-encodes of very large originals.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
  },
};

export default nextConfig;
