"use client";

import Image from "next/image";
import { useState } from "react";
import clsx from "clsx";
import { Reveal, SplitHeading, Eyebrow, PillButton } from "@/components/ui";
import { CONTACT, waLink } from "@/data/vixel";
import { scrollToId } from "@/components/SmoothScroll";

const INTERESES = ["Publicidad en colectivos", "Tótems / Shopping", "Pantallas para flota", "Fachada / Outdoor", "Pisos LED", "Eventos"];

export default function Contacto() {
  const [form, setForm] = useState({ nombre: "", empresa: "", mensaje: "" });
  const [int, setInt] = useState<string[]>(["Publicidad en colectivos"]);

  const msg = `Hola Vixel, soy ${form.nombre || "—"}${form.empresa ? ` de ${form.empresa}` : ""}. Me interesa: ${int.join(", ")}. ${form.mensaje}`;

  return (
    <section id="contacto" className="relative overflow-hidden pt-28 md:pt-40">
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <Reveal>
              <Eyebrow>Contacto</Eyebrow>
            </Reveal>
            <SplitHeading
              text="Hablemos de tu pantalla."
              accent={["pantalla."]}
              className="mt-6 font-display text-[clamp(3rem,7.5vw,7.4rem)] font-medium leading-[0.9] tracking-[-0.055em]"
            />
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-md text-[17px] leading-relaxed text-ink-dim">
                Publicidad en colectivos, tótems, pisos, fachadas o eventos: te asesoramos y diseñamos la solución a medida. Alta
                de campaña en 48 h.
              </p>
            </Reveal>
            <div className="mt-12 space-y-3">
              {CONTACT.people.map((p, i) => (
                <Reveal key={p.wa} delay={0.2 + i * 0.08}>
                  <a
                    href={`https://wa.me/${p.wa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between rounded-[1.4rem] p-5 shadow-[inset_0_0_0_1px_var(--hair)] transition-colors duration-500 hover:bg-white/[0.03]"
                  >
                    <span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">WhatsApp</span>
                      <span className="mt-1 block text-[17px] font-medium">{p.name}</span>
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="hidden font-mono text-[14px] text-ink-dim sm:block">{p.phone}</span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-cyan group-hover:text-bg">
                        ↗
                      </span>
                    </span>
                  </a>
                </Reveal>
              ))}
              <Reveal delay={0.36}>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="group flex items-center justify-between rounded-[1.4rem] p-5 shadow-[inset_0_0_0_1px_var(--hair)] transition-colors duration-500 hover:bg-white/[0.03]"
                >
                  <span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Email</span>
                    <span className="mt-1 block text-[17px] font-medium">{CONTACT.email}</span>
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:bg-cyan group-hover:text-bg">
                    ↗
                  </span>
                </a>
              </Reveal>
            </div>
          </div>

          <Reveal delay={0.1} className="lg:col-span-6">
            <form
              className="bezel"
              onSubmit={(e) => {
                e.preventDefault();
                window.open(waLink(msg), "_blank", "noopener");
              }}
            >
              <div className="bezel-core space-y-6 p-7 md:p-10">
                <p className="font-display text-2xl font-medium tracking-[-0.03em]">Pedí tu propuesta</p>
                {(
                  [
                    ["nombre", "Nombre"],
                    ["empresa", "Empresa / marca"],
                  ] as const
                ).map(([k, l]) => (
                  <label key={k} className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">{l}</span>
                    <input
                      value={form[k]}
                      onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      className="mt-2 w-full border-b border-hair-2 bg-transparent pb-3 text-[17px] transition-colors focus:border-cyan focus:outline-none"
                    />
                  </label>
                ))}
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Me interesa</span>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {INTERESES.map((x) => {
                      const on = int.includes(x);
                      return (
                        <button
                          type="button"
                          key={x}
                          onClick={() => setInt((s) => (on ? s.filter((y) => y !== x) : [...s, x]))}
                          className={clsx(
                            "rounded-full px-3.5 py-2 text-[13px] transition-all duration-400",
                            on ? "bg-ink text-bg" : "text-ink-dim shadow-[inset_0_0_0_1px_var(--hair-2)] hover:text-ink",
                          )}
                          aria-pressed={on}
                        >
                          {x}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <label className="block">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Mensaje</span>
                  <textarea
                    rows={3}
                    value={form.mensaje}
                    onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                    className="mt-2 w-full resize-none border-b border-hair-2 bg-transparent pb-3 text-[17px] focus:border-cyan focus:outline-none"
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <p className="text-[12px] text-ink-mute">Se abre WhatsApp con tu consulta lista.</p>
                  <button
                    type="submit"
                    className="group inline-flex items-center gap-3 rounded-full bg-ink py-2 pl-6 pr-2 text-[15px] font-medium text-bg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]"
                  >
                    Enviar consulta
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-cyan transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                      ↗
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </Reveal>
        </div>
      </div>

      {/* footer */}
      <footer className="relative mt-32 border-t border-hair">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-5 py-12 md:flex-row md:items-end md:justify-between md:px-10">
          <div className="flex items-center gap-4">
            <Image src="/img/vixel-v.png" alt="Vixel" width={52} height={46} className="h-11 w-auto" />
            <div>
              <p className="font-display text-xl font-semibold tracking-[-0.03em]">Vixel</p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-mute">Fabricación · Instalación · Publicidad</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13.5px] text-ink-dim">
            {[
              ["formato", "Formato"],
              ["red", "Recorridos"],
              ["audiencia", "Audiencia"],
              ["planes", "Planes"],
              ["soluciones", "Shoppings"],
              ["flota", "Flota"],
            ].map(([id, l]) => (
              <button key={id} onClick={() => scrollToId(id)} className="transition-colors hover:text-ink">
                {l}
              </button>
            ))}
          </div>
          <PillButton variant="ghost" onClick={() => scrollToId("top")}>
            Volver arriba
          </PillButton>
        </div>
        <div className="mx-auto flex max-w-[1400px] flex-wrap justify-between gap-3 px-5 pb-8 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-mute md:px-10">
          <span>© 2026 Vixel · {CONTACT.city}</span>
          <span>Valores + IVA en pesos argentinos · Datos de audiencia: escenario base</span>
        </div>
      </footer>
    </section>
  );
}
