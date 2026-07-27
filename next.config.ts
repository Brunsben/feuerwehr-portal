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
  // typescript-eslint unterstützt TS7 noch nicht → npm run lint liefert nur Basis-Regeln via eslint.config.mjs
  // Next.js 16 führt kein Linting mehr als Teil von next build durch
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
