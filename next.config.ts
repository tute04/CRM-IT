import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdf2json"],
  images: { unoptimized: true },
};

export default nextConfig;
