"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAccessToken, isExpired, login } from "@/lib/auth";

// "volver" se lee de location en vez de useSearchParams para que la página
// siga siendo estática (con cacheComponents, useSearchParams pide Suspense).
function destino() {
  const volver = new URLSearchParams(location.search).get("volver");
  return volver && volver.startsWith("/") && !volver.startsWith("//") ? volver : "/panel";
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si ya hay un token vigente, no tiene sentido mostrar el login de nuevo.
  useEffect(() => {
    const token = getAccessToken();
    if (token && !isExpired(token)) location.replace(destino());
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username.trim(), password);
      location.href = destino();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <div className="bo-card w-full max-w-[420px] !p-8">
        <Link href="/" className="mb-8 flex items-center gap-2.5" aria-label="Vixel, inicio">
          <Image src="/img/vixel-v.png" alt="" width={30} height={26} className="h-[26px] w-auto" priority />
          <span className="font-display text-[19px] font-semibold tracking-[-0.03em]">Vixel</span>
        </Link>
        <h1 className="font-display text-[1.9rem] font-medium leading-tight tracking-[-0.04em]">Ingresar al panel</h1>
        <p className="bo-sub">Seguimiento de flota y configuración remota.</p>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="bo-field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              className="bo-input"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="bo-field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="bo-input"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="bo-btn bo-btn-primary mt-2 w-full" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          {error && <div className="bo-alert error">{error}</div>}
        </form>

        <Link href="/" className="mt-8 inline-block text-[14px] text-ink-dim transition-colors hover:text-ink">
          ← Volver al sitio
        </Link>
      </div>
    </main>
  );
}
