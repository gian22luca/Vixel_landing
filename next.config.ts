import type { NextConfig } from "next";

// Reemplaza al vercel.json del sitio viejo (headers de seguridad), que esta
// rama borro sin poner nada en su lugar.
//
// script-src necesita 'unsafe-inline': las paginas de esta app se generan
// estaticas en el build (confirmado en `next build` -- todas las rutas
// salen "○ Static"), no por request, asi que un nonce por-request via
// middleware nunca puede coincidir con el HTML ya generado (se probo y
// rompe la hidratacion de React por completo, ver notas del PR). La
// alternativa correcta -- forzar renderizado dinamico para poder usar
// nonces -- tiene un costo real (pierde el cacheo estatico) que no vale la
// pena para lo que es basicamente una landing.
//
// Dominios externos reales que usa esta app (confirmados por grep sobre
// src/): Nominatim (geocodificar en /gestion) y ThingSpeak (posicion GPS en
// /panel) via fetch -> connect-src; los tiles de OpenStreetMap los carga
// Leaflet como <img> -> img-src. Las fuentes son next/font/google (se
// autohospedan en el build, mismo origen) asi que no hace falta
// whitelistear fonts.googleapis.com/fonts.gstatic.com como en el sitio
// viejo. Las llamadas a /api/* van al mismo origen (rewrite de arriba hacia
// el backend), por eso no hace falta listar api.vixel.com.ar en connect-src.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://*.tile.openstreetmap.org",
  "font-src 'self'",
  "connect-src 'self' https://nominatim.openstreetmap.org https://api.thingspeak.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // El backend Django solo acepta CORS desde https://vixel.com.ar. Pasando
  // las llamadas por el mismo dominio de la web, el navegador nunca hace un
  // request cross-origin y funciona igual en vercel.app, previews o local.
  async rewrites() {
    return [{ source: "/api/:path*", destination: "https://api.vixel.com.ar/api/:path*/" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
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
