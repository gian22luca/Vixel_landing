"use client";

import Image from "next/image";
import { useState } from "react";
import { motion } from "motion/react";
import LedCanvas from "@/components/LedCanvas";
import { Reveal, SectionHead } from "@/components/ui";
import { SPECS } from "@/data/vixel";

export default function Formato() {
  const [brand, setBrand] = useState("");
  return (
    <section id="formato" className="relative py-28 md:py-40">
      <div className="pointer-events-none absolute inset-0 led-dots opacity-40" />
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <SectionHead
            className="lg:col-span-7"
            eyebrow="02 · El formato"
            title="1,02 m² de LED donde todos miran."
            accent={["LED"]}
            text="La luneta es el único plano publicitario que el conductor detenido detrás mira de frente, sin competencia visual, durante los 40 a 90 segundos que dura un semáforo porteño."
          />
          <Reveal delay={0.2} className="lg:col-span-5">
            <div className="flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-dim lg:justify-end">
              {["P4 · 400×160", "5.500 nits", "+33% vs 400×120"].map((t) => (
                <span key={t} className="rounded-full px-4 py-2 shadow-[inset_0_0_0_1px_var(--hair-2)]">
                  {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* simulador */}
        <Reveal className="mt-16 md:mt-20">
          <div className="bezel">
            <div className="bezel-core p-4 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-mint shadow-[0_0_10px_var(--mint)]" />
                  Simulador de luneta · escala real 5:2
                </div>
                <label className="flex w-full items-center gap-3 rounded-full bg-white/[0.03] py-2 pl-5 pr-2 shadow-[inset_0_0_0_1px_var(--hair-2)] focus-within:shadow-[inset_0_0_0_1px_rgba(46,230,245,0.55)] md:w-[360px]">
                  <input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    maxLength={14}
                    placeholder="Escribí tu marca y mirala en LED"
                    className="w-full bg-transparent text-[14.5px] placeholder:text-ink-mute focus:outline-none"
                    aria-label="Nombre de tu marca"
                  />
                  <span className="rounded-full bg-cyan/15 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan">live</span>
                </label>
              </div>
              <div className="relative mt-6 rounded-[1.25rem] bg-[#161616] p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_20px_60px_rgba(0,0,0,0.9)] md:p-5">
                <LedCanvas brand={brand} force={brand ? 0 : undefined} cols={200} className="aspect-[5/2] w-full" />
                {/* cotas */}
                <div className="pointer-events-none absolute -bottom-7 left-3 right-3 hidden items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-ink-mute md:flex">
                  <span className="h-px flex-1 bg-hair-2" /> 1,60 m · 400 px <span className="h-px flex-1 bg-hair-2" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <div className="mt-24 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* specs */}
          <Reveal className="lg:col-span-5">
            <div className="bezel h-full">
              <div className="bezel-core h-full p-8 md:p-10">
                <h3 className="font-display text-2xl font-medium tracking-[-0.03em]">Ficha técnica</h3>
                <dl className="mt-8 divide-y divide-hair">
                  {SPECS.map((s, i) => (
                    <motion.div
                      key={s.k}
                      className="flex items-baseline justify-between gap-6 py-3.5"
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-mute">{s.k}</dt>
                      <dd className="text-right text-[15px] text-ink">{s.v}</dd>
                    </motion.div>
                  ))}
                </dl>
                <p className="mt-8 text-[13.5px] leading-relaxed text-ink-dim">
                  ¿Por qué P4? La lectura real es desde un auto detenido detrás, entre 4 y 20 metros. A esa distancia el P4
                  resuelve perfecto y permite una pantalla más grande y más brillante. Instalación no invasiva y reversible.
                </p>
              </div>
            </div>
          </Reveal>
          {/* fotos reales */}
          <div className="grid grid-cols-2 gap-6 lg:col-span-7">
            {[
              { src: "/img/luneta-epifania.jpg", cap: "En calle · Buenos Aires" },
              { src: "/img/luneta-dia.jpg", cap: "Nocturno · 5.500 nits" },
              { src: "/img/bus-street.jpg", cap: "Luneta trasera · tránsito real", wide: true },
            ].map((p, i) => (
              <Reveal key={p.src} delay={i * 0.1} className={p.wide ? "col-span-2" : ""}>
                <figure className="bezel">
                  <div className={`bezel-core group relative ${p.wide ? "aspect-[16/8]" : "aspect-square"}`}>
                    <Image
                      src={p.src}
                      alt={p.cap}
                      fill
                      sizes="(min-width:1024px) 40vw, 90vw"
                      className="object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                    />
                    <figcaption className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink">
                      {p.cap}
                    </figcaption>
                  </div>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
