import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  experimental: {
    useTypeScriptCli: true,
  },
  // typescript-eslint unterstützt TS7 noch nicht → Linting im Build überspringen
  // Entfernen sobald typescript-eslint TS7 unterstützt (https://github.com/typescript-eslint/typescript-eslint/issues/10940)
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Portal läuft auf Root-Pfad — kein basePath
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
