import type { NextConfig } from "next";

// Tauri bundles the frontend as static files, so Next.js must emit a fully
// static export (no Node server) into `out/`. See src-tauri/tauri.conf.json
// for `frontendDist`.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
