"use client";

import { useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import { Reveal, SectionHead } from "@/components/ui";
import { DAYS, FRANJAS, SHOW_PRICES, fmt, money } from "@/data/vixel";

const color = (v: number) => {
  // 0.55 → azul profundo, 1.45 → cian/menta brillante
  const k = Math.min(1, Math.max(0, (v - 0.5) / 1));
  return `rgba(${Math.round(43 + k * 17)}, ${Math.round(60 + k * 195)}, ${Math.round(255 - k * 55)}, ${0.12 + k * 0.78})`;
};

export default function Franjas() {
  const [sel, setSel] = useState(2);
  const f = FRANJAS[sel];
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <SectionHead
          eyebrow="06 · Planificación"
          title="Comprá la hora en que tu público está en la calle."
          accent={["hora"]}
          text="El día se divide en cuatro franjas con índices de audiencia distintos (1,00 = promedio del día). Evening Rush concentra el pico: tránsito máximo y luz baja, cuando el LED más se destaca."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <div className="bezel">
              <div className="bezel-core p-4 md:p-8">
                {/* mobile: una fila por franja, sin scroll lateral */}
                <div className="space-y-2 md:hidden">
                  <div className="grid grid-cols-[1fr_repeat(3,64px)] gap-1.5 px-1 font-mono text-[9px] uppercase tracking-[0.12em] text-ink-mute">
                    <span />
                    <span className="text-center">L–V</span>
                    <span className="text-center">Sáb</span>
                    <span className="text-center">Dom</span>
                  </div>
                  {FRANJAS.map((fr, c) => (
                    <button
                      key={fr.id}
                      onClick={() => setSel(c)}
                      className={clsx(
                        "grid w-full grid-cols-[1fr_repeat(3,64px)] items-center gap-1.5 rounded-2xl p-1.5 text-left transition-colors duration-500",
                        sel === c ? "bg-white/[0.07] ring-1 ring-cyan/60" : "bg-white/[0.02]",
                      )}
                    >
                      <span className="pl-2">
                        <span className="block text-[14px] font-medium leading-tight">{fr.name}</span>
                        <span className="font-mono text-[10px] text-ink-mute">{fr.hours} h</span>
                      </span>
                      {fr.idx.map((v, r) => (
                        <span
                          key={r}
                          className="flex h-14 items-center justify-center rounded-xl font-led text-[19px] font-black"
                          style={{ background: color(v) }}
                        >
                          {v.toFixed(2).replace(".", ",")}
                        </span>
                      ))}
                    </button>
                  ))}
                </div>
                <div className="hidden md:block">
                  <div className="grid grid-cols-[110px_repeat(4,1fr)] gap-2">
                    <span />
                    {FRANJAS.map((fr, i) => (
                      <button
                        key={fr.id}
                        onClick={() => setSel(i)}
                        className={clsx(
                          "rounded-xl px-3 py-2 text-left transition-colors duration-500",
                          sel === i ? "bg-white/[0.07]" : "hover:bg-white/[0.03]",
                        )}
                      >
                        <span className="block text-[13.5px] font-medium">{fr.name}</span>
                        <span className="font-mono text-[10.5px] tracking-[0.12em] text-ink-mute">{fr.hours} h</span>
                      </button>
                    ))}
                    {DAYS.map((d, r) => (
                      <div key={d} className="contents">
                        <span className="flex items-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim">{d}</span>
                        {FRANJAS.map((fr, c) => {
                          const v = fr.idx[r];
                          return (
                            <motion.button
                              key={fr.id}
                              onClick={() => setSel(c)}
                              className={clsx(
                                "relative flex h-24 items-end justify-between overflow-hidden rounded-xl p-3 text-left",
                                sel === c && "ring-1 ring-cyan/60",
                              )}
                              style={{ background: color(v) }}
                              initial={{ opacity: 0, scale: 0.9 }}
                              whileInView={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: (r * 4 + c) * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <span className="absolute inset-0 led-dots opacity-60" />
                              <span className="relative font-led text-[28px] font-black leading-none">{v.toFixed(2).replace(".", ",")}</span>
                              {v >= 1.35 && (
                                <span className="relative rounded-full bg-black/40 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em]">
                                  pico
                                </span>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-4">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col justify-between gap-10 p-8">
                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-cyan">Franja seleccionada</p>
                  <motion.h3
                    key={f.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 font-display text-[2.4rem] font-medium leading-none tracking-[-0.04em]"
                  >
                    {f.name}
                  </motion.h3>
                  <p className="mt-2 font-mono text-[12px] text-ink-dim">
                    {f.hours} h · {f.h} horas al aire
                  </p>
                </div>
                <dl className="space-y-4">
                  <div className="flex justify-between gap-4 border-b border-hair pb-3">
                    <dt className="text-ink-dim">Apariciones / mes</dt>
                    <dd className="font-medium">{fmt(f.apar)}</dd>
                  </div>
                  {SHOW_PRICES && (
                    <div className="flex justify-between gap-4 border-b border-hair pb-3">
                      <dt className="text-ink-dim">Precio por pantalla / mes</dt>
                      <dd className="font-medium">{money(f.price)}</dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-dim">Ideal para</dt>
                    <dd className="text-right font-medium">
                      {{ morning: "Bancos, educación", midday: "Shoppings, salud", evening: "Gastronomía, retail", night: "Entretenimiento" }[f.id]}
                    </dd>
                  </div>
                </dl>
                <p className="text-[13px] leading-relaxed text-ink-dim">
                  Combo Rush Total (06–10 + 16–21): 10.800 apariciones/mes{SHOW_PRICES && " · $210.000"}. Full Day 06–24 h: 21.600
                  apariciones{SHOW_PRICES && " · $300.000"}.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
