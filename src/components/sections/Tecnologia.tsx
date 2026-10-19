"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Reveal, SectionHead } from "@/components/ui";

function Geofence() {
  return (
    <svg viewBox="0 0 400 240" className="h-full w-full">
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={`h${i}`} x1="0" x2="400" y1={i * 22} y2={i * 22} stroke="rgba(255,255,255,0.06)" />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <line key={`v${i}`} y1="0" y2="240" x1={i * 22} x2={i * 22} stroke="rgba(255,255,255,0.06)" />
      ))}
      <motion.circle
        cx="250"
        cy="110"
        r="70"
        fill="#2ee6f5"
        fillOpacity={0.12}
        stroke="#2ee6f5"
        strokeDasharray="4 6"
        animate={{ r: [62, 74, 62] }}
        transition={{ duration: 3, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
      />
      <path id="gfroute" d="M10 200 C 90 190, 120 120, 200 115 S 330 80, 390 30" fill="none" stroke="#2b3cff" strokeWidth="3" />
      <circle r="6" fill="#fff">
        <animateMotion dur="6s" repeatCount="indefinite" rotate="auto">
          <mpath href="#gfroute" />
        </animateMotion>
      </circle>
      <circle cx="250" cy="110" r="4" fill="#3cffc8" />
      <text x="262" y="104" fill="#3cffc8" fontSize="11" fontFamily="monospace">SUCURSAL · 500 m</text>
    </svg>
  );
}

export default function Tecnologia() {
  return (
    <section id="tecnologia" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <SectionHead
          eyebrow="07 · Tecnología"
          title="Digital signage + GPS. Un cartel que se convierte en medio auditable."
          accent={["GPS."]}
          text="Toda la red se administra desde un panel web. La pauta cambia en minutos, sin tocar el colectivo, y cada reproducción queda registrada."
        />

        <div className="mt-16 grid auto-rows-[minmax(220px,auto)] grid-cols-1 gap-6 md:grid-cols-6">
          <Reveal className="md:col-span-4 md:row-span-2">
            <div className="bezel h-full">
              <div className="bezel-core relative flex h-full flex-col p-8">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-cyan">Geolocalización</p>
                <h3 className="mt-3 max-w-md font-display text-3xl font-medium tracking-[-0.035em]">
                  Geofencing: el spot sale sólo dentro de la zona que elijas.
                </h3>
                <p className="mt-3 max-w-md text-[14.5px] text-ink-dim">
                  Ej.: tu sucursal aparece cuando el colectivo pasa a 500 m. Creatividad dinámica por barrio o corredor, y
                  disparadores por clima, hora o evento.
                </p>
                <div className="mt-6 min-h-[220px] flex-1 overflow-hidden rounded-2xl bg-[#1b1b1b] shadow-[inset_0_0_0_1px_var(--hair)]">
                  <Geofence />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08} className="md:col-span-2">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col justify-between p-7">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-cyan">Tiempo real</p>
                <div>
                  <p className="font-led text-6xl font-black leading-none">&lt;5′</p>
                  <p className="mt-3 text-[14px] text-ink-dim">
                    Subís la pieza desde el navegador y se publica en toda la red. Programación por fecha y franja, rotación A/B.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.14} className="md:col-span-2">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col justify-between p-7">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-cyan">Accountability</p>
                <ul className="space-y-2.5 text-[14px]">
                  {["Log de reproducción por pantalla y spot", "Mapa de calor del recorrido real", "Certificado de emisión mensual", "Alertas de pantalla fuera de servicio"].map(
                    (t) => (
                      <li key={t} className="flex gap-3 text-ink-dim">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-mint" />
                        {t}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.06} className="md:col-span-3">
            <div className="bezel h-full">
              <div className="bezel-core relative h-full min-h-[280px]">
                <Image src="/img/bus-night.jpg" alt="Colectivo con pantalla LED trasera de noche" fill sizes="50vw" className="object-cover" />
                <div className="absolute inset-0 bg-black/55" />
                <div className="absolute bottom-0 p-7">
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-cyan">Hardware</p>
                  <p className="mt-2 max-w-sm font-display text-2xl font-medium tracking-[-0.03em]">
                    P4 · 5.500 nits con regulación automática de brillo. Legible al sol y de noche.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12} className="md:col-span-3">
            <div className="bezel h-full">
              <div className="bezel-core flex h-full flex-col justify-between gap-8 p-7">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-cyan">Diferencial</p>
                <p className="font-display text-[1.6rem] font-medium leading-tight tracking-[-0.03em]">
                  “La luneta de vinilo se imprime una vez y se pega un mes. Con Vixel cambiás el mensaje a la mañana, otra vez a
                  la tarde, y sabés dónde estuvo cada impresión.”
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Cero impresión", "Cero logística", "12 V del vehículo", "4G + GPS"].map((t) => (
                    <span key={t} className="rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-dim shadow-[inset_0_0_0_1px_var(--hair-2)]">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
