import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // El backend Django solo acepta CORS desde https://vixel.com.ar. Pasando
  // las llamadas por el mismo dominio de la web, el navegador nunca hace un
  // request cross-origin y funciona igual en vercel.app, previews o local.
  async rewrites() {
    return [{ source: "/api/:path*", destination: "https://api.vixel.com.ar/api/:path*/" }];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
