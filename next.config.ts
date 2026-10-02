import type { NextConfig } from "next";

// GitHub Pages proje sitesi alt klasörde yayınlanır: https://<kullanıcı>.github.io/<depo>/
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
