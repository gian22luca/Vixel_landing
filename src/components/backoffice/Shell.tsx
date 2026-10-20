"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import clsx from "clsx";
import { apiFetch, clearTokens, getAccessToken, goToLogin, isExpired, logout, type Perfil } from "@/lib/auth";

const PerfilContext = createContext<Perfil | null>(null);

/** Perfil del usuario logueado; null mientras carga. */
export function usePerfil() {
  return useContext(PerfilContext);
}

const LINKS = [
  { href: "/panel", label: "Seguimiento" },
  { href: "/gestion", label: "Gestión" },
  { href: "/config", label: "Configuración" },
];

function tokenValido() {
  const token = getAccessToken();
  return !!token && !isExpired(token);
}
const noSubscribe = () => () => {};

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // En el server (y al hidratar) es false; en el navegador se lee el token.
  const ready = useSyncExternalStore(noSubscribe, tokenValido, () => false);
  const [perfil, setPerfil] = useState<Perfil | null>(null);

  // Sin token válido se va a /login guardando a dónde volver. Las páginas no
  // se montan hasta pasar este chequeo, así no salen requests sin token.
  useEffect(() => {
    if (!tokenValido()) {
      clearTokens();
      goToLogin();
      return;
    }
    apiFetch("/api/auth/perfil/")
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => p && setPerfil(p))
      .catch(() => {});
  }, []);

  if (!ready) return <div className="min-h-[100dvh]" />;

  return (
    <PerfilContext.Provider value={perfil}>
      <header className="sticky top-0 z-[50] border-b border-hair bg-[rgba(35,35,35,0.85)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Vixel, inicio">
            <Image src="/img/vixel-v.png" alt="" width={30} height={26} className="h-[22px] w-auto" />
            <span className="font-display text-[17px] font-semibold tracking-[-0.03em]">Vixel</span>
          </Link>
          <nav className="order-3 flex w-full flex-wrap gap-1 md:order-none md:w-auto">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "rounded-full px-3.5 py-2 text-[13.5px] transition-colors duration-300",
                  pathname === l.href ? "bg-white/[0.08] text-ink" : "text-ink-dim hover:bg-white/[0.05] hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {perfil && (
              <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute sm:inline">
                {perfil.username} · {perfil.rol}
              </span>
            )}
            <button onClick={logout} className="bo-btn bo-btn-ghost bo-btn-sm">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>
      {children}
    </PerfilContext.Provider>
  );
}
