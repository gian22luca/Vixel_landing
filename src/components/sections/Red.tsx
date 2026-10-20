"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "motion/react";
import clsx from "clsx";
import { Counter, Reveal, SectionHead } from "@/components/ui";
import { LANDMARKS, LINES, TOTAL_COCHES, TOTAL_SEMAFOROS, TOTAL_SUBE_HABIL, type Line } from "@/data/lines";
import { MAP, project, smoothPath } from "@/lib/geo";
import { fmt } from "@/data/vixel";

const EASE = [0.22, 1, 0.36, 1] as const;
// recorte del mapa a la zona que cubre la red
const VB = { x: 40, y: 60, w: 960, h: 760 };

function Buses({ line, paths, active }: { line: Line; paths: React.RefObject<Record<string, SVGPathElement | null>>; active: boolean }) {
  const g = useRef<SVGGElement>(null);
  const n = Math.max(3, Math.round(line.coches / 12));
  useEffect(() => {
    let raf = 0;
    const seeds = Array.from({ length: n }, (_, i) => ({ o: i / n, dir: i % 2 ? 1 : -1 }));
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const p = paths.current?.[line.id];
      const el = g.current;
      if (!p || !el) return;
      const L = p.getTotalLength();
      el.childNodes.forEach((c, i) => {
        const s = seeds[i];
        let u = (s.o + (t / 1000) * 0.012 * s.dir) % 1;
        if (u < 0) u += 1;
        const pt = p.getPointAtLength(u * L);
        (c as SVGGElement).setAttribute("transform", `translate(${pt.x},${pt.y})`);
      });
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [line.id, n, paths]);
  return (
    <g ref={g} style={{ opacity: active ? 1 : 0.35, transition: "opacity .6s" }}>
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <circle r={active ? 9 : 5} fill={line.color} opacity={0.18} />
          <rect x={-3} y={-3} width={6} height={6} rx={1.2} fill="#fff" />
        </g>
      ))}
    </g>
  );
}

export default function Red() {
  const [sel, setSel] = useState<string>("39");
  const paths = useRef<Record<string, SVGPathElement | null>>({});
  const mapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(mapRef, { once: true, margin: "-15% 0px" });
  const d = useMemo(() => Object.fromEntries(LINES.map((l) => [l.id, smoothPath(l.path)])), []);
  const line = LINES.find((l) => l.id === sel)!;
  const ends = useMemo(() => [project(line.path[0]), project(line.path[line.path.length - 1])], [line]);

  return (
    <section id="red" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <SectionHead
            className="lg:col-span-7"
            eyebrow="04 · La red"
            title="Cinco líneas que cruzan la ciudad de punta a punta."
            accent={["ciudad"]}
            text="Corredores de alto tránsito: Santa Fe, 9 de Julio, Callao, Corrientes, Libertador, Cabildo. Las líneas pasan por Constitución, Obelisco, Congreso, Plaza Italia, Abasto, Facultad de Derecho y Belgrano."
          />
          <div className="grid grid-cols-3 gap-6 lg:col-span-5">
            {[
              { n: TOTAL_COCHES, l: "Coches en flota" },
              { n: TOTAL_SUBE_HABIL, l: "Pasajeros / día hábil*" },
              { n: TOTAL_SEMAFOROS, l: "Cruces semaforizados" },
            ].map((s, i) => (
              <Reveal key={s.l} delay={i * 0.08}>
                <Counter to={s.n} className="block font-display text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-none tracking-[-0.04em]" />
                <p className="mt-2 font-mono text-[10px] uppercase leading-snug tracking-[0.16em] text-ink-mute">{s.l}</p>
              </Reveal>
            ))}
          </div>
        </div>

        {/* selector de líneas */}
        <Reveal className="mt-14">
          <div className="flex flex-wrap gap-2">
            {LINES.map((l) => (
              <button
                key={l.id}
                onClick={() => setSel(l.id)}
                className={clsx(
                  "group flex items-center gap-3 rounded-full py-2 pl-2 pr-5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]",
                  sel === l.id ? "bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]" : "shadow-[inset_0_0_0_1px_var(--hair)] hover:bg-white/[0.04]",
                )}
              >
                <span
                  className="flex h-9 min-w-[52px] items-center justify-center rounded-full px-2 font-led text-lg font-black text-bg"
                  style={{ background: l.color, boxShadow: sel === l.id ? `0 0 22px ${l.color}` : "none" }}
                >
                  {l.id}
                </span>
                <span className="text-left">
                  <span className="block text-[13.5px] font-medium leading-tight">Línea {l.id}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-mute">{l.coches} coches</span>
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* mapa */}
          <Reveal className="lg:col-span-7">
            <div className="bezel">
              <div ref={mapRef} className="bezel-core relative">
                <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} className="h-auto w-full" role="img" aria-label={`Mapa de CABA con el recorrido de la línea ${sel}`}>
                  <defs>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="5" result="b" />
                      <feMerge>
                        <feMergeNode in="b" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                    <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
                      <circle cx="6" cy="6" r="0.9" fill="rgba(255,255,255,0.07)" />
                    </pattern>
                  </defs>
                  <rect x={VB.x} y={VB.y} width={VB.w} height={VB.h} fill="url(#dots)" />
                  {/* Río de la Plata */}
                  <text x={900} y={240} fill="rgba(255,255,255,0.25)" fontSize="13" fontFamily="var(--font-geist-mono)" letterSpacing="4" transform="rotate(-58 900 240)">
                    RÍO DE LA PLATA
                  </text>
                  {MAP.barrios.map((b) => {
                    const on = line.barrios.some((n) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase() === b.n.toLowerCase());
                    return (
                      <path
                        key={b.n}
                        d={b.d}
                        fill={on ? line.color : "#2b2b2b"}
                        fillOpacity={on ? 0.09 : 0.9}
                        stroke={on ? line.color : "rgba(255,255,255,0.12)"}
                        strokeOpacity={on ? 0.45 : 1}
                        strokeWidth={0.8}
                        style={{ transition: "fill .7s, stroke .7s, fill-opacity .7s" }}
                      />
                    );
                  })}
                  {/* recorridos */}
                  {LINES.map((l) => (
                    <path
                      key={`bg${l.id}`}
                      d={d[l.id]}
                      fill="none"
                      stroke={l.color}
                      strokeOpacity={l.id === sel ? 0 : 0.28}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      ref={(el) => {
                        paths.current[l.id] = el;
                      }}
                      style={{ transition: "stroke-opacity .6s" }}
                    />
                  ))}
                  <AnimatePresence mode="wait">
                    {inView && (
                      <motion.path
                        key={sel}
                        d={d[sel]}
                        fill="none"
                        stroke={line.color}
                        strokeWidth={5}
                        strokeLinecap="round"
                        filter="url(#glow)"
                        initial={{ pathLength: 0, opacity: 0.4 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ pathLength: { duration: 1.8, ease: EASE }, opacity: { duration: 0.3 } }}
                      />
                    )}
                  </AnimatePresence>
                  {LINES.map((l) => (
                    <Buses key={`b${l.id}`} line={l} paths={paths} active={l.id === sel} />
                  ))}
                  {/* cabeceras */}
                  {ends.map(([x, y], i) => (
                    <g key={`${sel}${i}`} transform={`translate(${x},${y})`}>
                      <circle r="10" fill="none" stroke={line.color} strokeWidth="1.5">
                        <animate attributeName="r" values="6;16;6" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                      <circle r="5" fill={line.color} />
                    </g>
                  ))}
                  {/* hitos */}
                  {LANDMARKS.map((m) => {
                    const [x, y] = project(m.p);
                    return (
                      <g key={m.n} transform={`translate(${x},${y})`}>
                        <rect x={-2.5} y={-2.5} width={5} height={5} fill="#eef3ff" opacity={0.85} />
                        <text x={8} y={4} fill="#d9d9d9" fontSize="13" fontFamily="var(--font-geist)" style={{ paintOrder: "stroke" }} stroke="#232323" strokeWidth={4}>
                          {m.n}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-dim">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint" />
                  CABA · simulación de flota
                </div>
              </div>
            </div>
          </Reveal>

          {/* ficha de la línea */}
          <Reveal delay={0.1} className="lg:col-span-5">
            <div className="bezel h-full">
              <div className="bezel-core h-full p-7 md:p-9">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={sel}
                    initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(6px)" }}
                    transition={{ duration: 0.55, ease: EASE }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-mute">{line.empresa}</p>
                        <h3 className="mt-2 font-display text-[2.6rem] font-medium leading-none tracking-[-0.045em]">Línea {line.id}</h3>
                        <p className="mt-3 text-[14.5px] text-ink-dim">
                          {line.cabeceras[0]} <span style={{ color: line.color }}>⟷</span> {line.cabeceras[1]}
                        </p>
                      </div>
                      <span className="font-led text-6xl font-black leading-none" style={{ color: line.color, textShadow: `0 0 30px ${line.color}88` }}>
                        {line.coches}
                      </span>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-hair">
                      {[
                        { k: "Pasajeros día hábil", v: fmt(line.sube.habil) },
                        { k: "Pasajeros / mes", v: fmt(line.sube.mensual) },
                        { k: "Km en CABA", v: `${line.kmCaba.toLocaleString("es-AR")} km` },
                        { k: "Vuelta", v: line.duracion },
                        { k: "Horario", v: line.horario },
                        { k: "Semáforos", v: `≈ ${line.semaforos}` },
                      ].map((x) => (
                        <div key={x.k} className="bg-[#262626] p-4">
                          <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-mute">{x.k}</p>
                          <p className="mt-1.5 text-[15px] font-medium">{x.v}</p>
                        </div>
                      ))}
                    </div>

                    <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Frecuencia</p>
                    <p className="mt-1.5 text-[14.5px]">{line.frecuencia}</p>

                    <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Corredores</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {line.corredores.map((c) => (
                        <span key={c} className="rounded-full px-2.5 py-1 text-[12.5px] shadow-[inset_0_0_0_1px_var(--hair-2)]">
                          {c}
                        </span>
                      ))}
                    </div>

                    <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Puntos de interés</p>
                    <ol className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13.5px] text-ink-dim">
                      {line.hitos.map((h, i) => (
                        <li key={h} className="flex gap-2">
                          <span className="font-mono text-[10px] leading-5" style={{ color: line.color }}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          {h}
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>

        {/* comparación de líneas */}
        <Reveal className="mt-6">
          <div className="bezel">
            <div className="bezel-core p-6 md:p-8">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-display text-xl font-medium tracking-[-0.03em]">Pasajeros por día hábil · SUBE 2025</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">mediana de días hábiles</span>
              </div>
              <div className="mt-6 space-y-3">
                {[...LINES]
                  .sort((a, b) => b.sube.habil - a.sube.habil)
                  .map((l, i) => (
                    <button key={l.id} onClick={() => setSel(l.id)} className="grid w-full grid-cols-[64px_1fr_90px] items-center gap-4 text-left">
                      <span className="font-led text-lg font-black" style={{ color: l.color }}>
                        {l.id}
                      </span>
                      <span className="relative h-7 overflow-hidden rounded-md bg-white/[0.03]">
                        <motion.span
                          className="absolute inset-y-0 left-0 rounded-md"
                          style={{ background: l.color, opacity: sel === l.id ? 1 : 0.55 }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${(l.sube.habil / 60000) * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.4, ease: EASE, delay: i * 0.08 }}
                        />
                      </span>
                      <span className="text-right font-mono text-[13px] tabular-nums">{fmt(l.sube.habil)}</span>
                    </button>
                  ))}
              </div>
              <p className="mt-6 text-[12px] leading-relaxed text-ink-mute">
                *Usos de tarjeta SUBE (no personas únicas). Fuente: datos.transporte.gob.ar, “Cantidad de transacciones SUBE por
                día”, 2025. Las líneas 67 y 124 incluyen su tramo en provincia. Recorridos: geometría oficial CNRT/Min. de
                Transporte. Semáforos: dataset GCBA, cruces a menos de 25 m del recorrido.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
