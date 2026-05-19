import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // El build no debe fallar por lint; usar `npm run lint` aparte.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
