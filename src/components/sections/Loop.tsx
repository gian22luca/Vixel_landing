"use client";

import { useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import LedCanvas from "@/components/LedCanvas";
import { Counter, Reveal, SectionHead } from "@/components/ui";
import { SLIDES } from "@/lib/adPainter";

const PERIOD = 3; // 15″ reales comprimidos a 3″ en la demo

export default function Loop() {
  const [slide, setSlide] = useState(0);
  return (
    <section className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <SectionHead
          eyebrow="03 · Cómo funciona"
          title="Tu marca, cada 90 segundos."
          accent={["90", "segundos."]}
          text="Cada pantalla emite un ciclo de 90″ dividido en 6 posiciones de 15″. Cinco se comercializan; la sexta es institucional. Dos marcas competidoras nunca conviven en el mismo loop."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col p-5 md:p-8">
                <div className="rounded-2xl bg-[#161616] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
                  <LedCanvas period={PERIOD} cols={150} onSlide={setSlide} className="aspect-[5/2] w-full" />
                </div>
                {/* línea de tiempo */}
                <div className="mt-8 mb-8 grid grid-cols-6 gap-1.5">
                  {SLIDES.map((s, i) => (
                    <div key={s.name} className="flex flex-col gap-2">
                      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        {i === slide && (
                          <motion.div
                            key={`p${slide}`}
                            className="absolute inset-y-0 left-0 rounded-full bg-cyan"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: PERIOD, ease: "linear" }}
                          />
                        )}
                        {i < slide && <div className="absolute inset-0 bg-white/25" />}
                      </div>
                      <span
                        className={clsx(
                          "font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-500",
                          i === slide ? "text-cyan" : "text-ink-mute",
                        )}
                      >
                        {String(i * 15).padStart(2, "0")}″
                      </span>
                      <span className={clsx("truncate text-[12.5px] md:text-[13.5px]", i === slide ? "text-ink" : "text-ink-dim")}>
                        {i === 0 ? "Tu marca" : i === 5 ? "Vixel" : `Marca ${"ABCDE"[i]}`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-hair mt-8 lg:mt-auto">
                  {[
                    ["Spot", "15″"],
                    ["Loop", "90″ · 6 posiciones"],
                    ["Al aire", "06 a 24 h"],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-[#262626] p-4">
                      <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-mute">{k}</p>
                      <p className="mt-1 text-[14px] font-medium">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-6 lg:col-span-5">
            {[
              { n: 16.7, d: 1, s: "%", l: "Share of loop por marca" },
              { n: 40, s: "×", l: "Apariciones por hora" },
              { n: 720, s: "", l: "Apariciones por día · 06 a 24 h" },
              { n: 21600, s: "", l: "Apariciones por mes y por pantalla" },
            ].map((k, i) => (
              <Reveal key={k.l} delay={i * 0.08}>
                <div className="bezel h-full">
                  <div className="bezel-core flex h-full min-h-[180px] flex-col justify-between p-6">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute">KPI 0{i + 1}</span>
                    <div>
                      <Counter
                        to={k.n}
                        decimals={k.d ?? 0}
                        suffix={k.s}
                        className="block font-led text-[clamp(2.4rem,4vw,3.4rem)] font-black leading-none text-ink"
                      />
                      <p className="mt-3 text-[13.5px] leading-snug text-ink-dim">{k.l}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
            <Reveal delay={0.3} className="col-span-2">
              <div className="rounded-[2rem] bg-cyan/10 p-6 shadow-[inset_0_0_0_1px_rgba(46,230,245,0.2)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Regla comercial</p>
                <p className="mt-3 text-[15px] leading-relaxed text-ink">
                  Exclusividad de categoría por pantalla: comprás tu posición sabiendo que ninguna de las otras cuatro es tu
                  competencia directa. Loop corto = alta frecuencia y baja fatiga.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
