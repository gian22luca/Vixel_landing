"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import { Reveal, SectionHead, PillButton } from "@/components/ui";
import { AUDIENCE, FRANJAS, PERMANENCIA, SHOW_PRICES, fmt, money, waLink } from "@/data/vixel";
import { LINES, TOTAL_COCHES } from "@/data/lines";

type Esc = keyof typeof AUDIENCE.peoplePerKm;
const FR_OPTS = [
  { id: "full", name: "Full Day", hours: "06–24", factor: 1, price: 300000 },
  { id: "rush", name: "Rush Total", hours: "06–10 + 16–21", factor: (4 * 1.35 + 5 * 1.45) / 18, price: 210000 },
  ...FRANJAS.map((f) => ({ id: f.id, name: f.name, hours: f.hours, factor: (f.h * f.idx[0]) / 18, price: f.price })),
];

function Big({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <div>
      <AnimatePresence mode="popLayout">
        <motion.p
          key={value}
          initial={{ y: 22, opacity: 0, filter: "blur(6px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -22, opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={clsx("font-display text-[clamp(2rem,3.6vw,3.3rem)] font-medium leading-none tracking-[-0.045em] tabular-nums", accent && "text-gradient")}
        >
          {value}
        </motion.p>
      </AnimatePresence>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">{label}</p>
    </div>
  );
}

export default function Audiencia() {
  const [screens, setScreens] = useState(10);
  const [esc, setEsc] = useState<Esc>("base");
  const [fr, setFr] = useState("full");
  const [perm, setPerm] = useState(0);
  const [lines, setLines] = useState<string[]>(LINES.map((l) => l.id));

  const r = useMemo(() => {
    const f = FR_OPTS.find((x) => x.id === fr)!;
    const perScreenDay = AUDIENCE.kmPerDay * AUDIENCE.peoplePerKm[esc];
    const expos = screens * perScreenDay * AUDIENCE.daysPerMonth * f.factor;
    const impactos = expos * AUDIENCE.shareOfLoop;
    const hoursShare = fr === "full" ? 1 : fr === "rush" ? 9 / 18 : (FRANJAS.find((x) => x.id === fr)!.h ?? 18) / 18;
    const apar = screens * AUDIENCE.appearancesPerMonth * hoursShare;
    const unit = f.price * (1 - PERMANENCIA[perm].d / 100);
    const inv = screens * unit;
    const cpm = inv / (impactos / 1000);
    const km = screens * AUDIENCE.kmPerDay * AUDIENCE.daysPerMonth;
    // reparto proporcional a la flota de las líneas elegidas
    const sel = LINES.filter((l) => lines.includes(l.id));
    const fleet = sel.reduce((a, l) => a + l.coches, 0) || 1;
    const rounded = sel.map((l) => Math.round((l.coches / fleet) * screens));
    const used = rounded.slice(0, -1).reduce((a, n) => a + n, 0);
    const split = sel.map((l, i) => ({ l, n: Math.max(0, i === sel.length - 1 ? screens - used : rounded[i]) }));
    return { expos, impactos, apar, inv, cpm, km, split, unit };
  }, [screens, esc, fr, perm, lines]);

  const potencial = TOTAL_COCHES * AUDIENCE.kmPerDay * AUDIENCE.peoplePerKm.base;

  return (
    <section id="audiencia" className="relative py-28 md:py-40">
      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
        <SectionHead
          eyebrow="05 · Audiencia"
          title="Cuánta gente ve tu marca. Calculalo."
          accent={["Calculalo."]}
          text="Contamos a las personas en posición efectiva de ver la luneta: conductores y acompañantes detrás y en carriles contiguos, motociclistas, pasajeros de otras unidades y peatones en cruces y paradas."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* controles */}
          <Reveal className="lg:col-span-5">
            <div className="bezel h-full">
              <div className="bezel-core h-full space-y-9 p-7 md:p-9">
                <div>
                  <div className="flex items-baseline justify-between">
                    <label htmlFor="screens" className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-dim">
                      Pantallas
                    </label>
                    <span className="font-led text-4xl font-black text-cyan">{screens}</span>
                  </div>
                  <input
                    id="screens"
                    type="range"
                    min={5}
                    max={30}
                    value={screens}
                    onChange={(e) => setScreens(+e.target.value)}
                    className="mt-4 w-full accent-[#2ee6f5]"
                  />
                  <div className="mt-2 flex justify-between font-mono text-[10px] text-ink-mute">
                    <span>Mín. 5</span>
                    <span>Red etapa 1 · 30</span>
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-dim">Líneas</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {LINES.map((l) => {
                      const on = lines.includes(l.id);
                      return (
                        <button
                          key={l.id}
                          onClick={() => setLines((s) => (on ? (s.length > 1 ? s.filter((x) => x !== l.id) : s) : [...s, l.id]))}
                          className={clsx("rounded-full px-4 py-2 font-led text-base font-black transition-all duration-400", on ? "text-bg" : "text-ink-dim shadow-[inset_0_0_0_1px_var(--hair-2)]")}
                          style={on ? { background: l.color } : undefined}
                          aria-pressed={on}
                        >
                          {l.id}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-dim">Franja horaria</p>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {FR_OPTS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFr(f.id)}
                        className={clsx(
                          "rounded-xl px-3 py-2.5 text-left transition-all duration-400",
                          fr === f.id ? "bg-white/[0.09] shadow-[inset_0_0_0_1px_rgba(46,230,245,0.45)]" : "shadow-[inset_0_0_0_1px_var(--hair)] hover:bg-white/[0.03]",
                        )}
                      >
                        <span className="block text-[13px] font-medium">{f.name}</span>
                        <span className="font-mono text-[10px] text-ink-mute">{f.hours}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div>
                    <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-dim">Escenario</p>
                    <div className="mt-3 flex gap-1 rounded-full p-1.5 shadow-[inset_0_0_0_1px_var(--hair)]">
                      {(["conservador", "base", "optimista"] as Esc[]).map((e) => (
                        <button
                          key={e}
                          onClick={() => setEsc(e)}
                          className={clsx("flex-1 whitespace-nowrap rounded-full px-4 py-2.5 text-[13px] capitalize transition-colors duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan", esc === e ? "bg-ink text-bg" : "text-ink-dim hover:text-ink")}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 font-mono text-[10px] text-ink-mute">{AUDIENCE.peoplePerKm[esc]} personas expuestas por km</p>
                  </div>
                  {SHOW_PRICES && (
                    <div>
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-dim">Permanencia</p>
                      <select
                        value={perm}
                        onChange={(e) => setPerm(+e.target.value)}
                        className="mt-3 w-full rounded-full bg-white/[0.03] px-5 py-3 text-[13px] shadow-[inset_0_0_0_1px_var(--hair)] focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan"
                      >
                        {PERMANENCIA.map((p, i) => (
                          <option key={p.m} value={i} className="bg-bg">
                            {p.m} {p.d ? `· −${p.d}%` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>

          {/* resultados */}
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="bezel h-full">
              <div className="bezel-core relative flex h-full flex-col p-7 md:p-10">
                <div className="absolute inset-0 led-dots opacity-30" />
                <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-2">
                  <Big value={fmt(Math.round(r.expos))} label="Exposiciones / mes" />
                  <Big value={fmt(Math.round(r.impactos))} label="Impactos atribuidos a tu marca / mes" accent />
                  <Big value={fmt(Math.round(r.apar))} label="Apariciones del spot / mes" />
                  <Big value={fmt(r.km)} label="Km recorridos por tu marca / mes" />
                  {SHOW_PRICES && <Big value={money(Math.round(r.inv))} label="Inversión mensual + IVA" />}
                  {SHOW_PRICES && <Big value={money(Math.round(r.cpm))} label="CPM (costo por mil impactos)" />}
                </div>

                <div className="relative mt-10 border-t border-hair pt-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-mute">Distribución sugerida por línea</p>
                  <div className="mt-3 flex h-10 overflow-hidden rounded-xl">
                    {r.split.map(({ l, n }) =>
                      n > 0 ? (
                        <motion.div
                          key={l.id}
                          layout
                          className="flex items-center justify-center font-led text-sm font-black text-bg"
                          style={{ background: l.color, flexGrow: n }}
                          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        >
                          {l.id}·{n}
                        </motion.div>
                      ) : null,
                    )}
                  </div>
                </div>

                <div className="relative mt-auto flex flex-col gap-6 pt-10 sm:flex-row sm:items-end sm:justify-between">
                  <p className="max-w-sm text-[12px] leading-relaxed text-ink-mute">
                    Modelo: {AUDIENCE.kmPerDay} km/día × personas/km × {AUDIENCE.daysPerMonth} días × índice de franja. El impacto
                    atribuido descuenta el tiempo en que la pantalla emite otras marcas (share of loop 1/6). Escenario base
                    más estricto que el mercado (+1.000.000 impactos/unidad publicados por otros operadores).
                  </p>
                  <PillButton
                    href={waLink(`Hola Vixel, quiero una propuesta: ${screens} pantallas, franja ${FR_OPTS.find((f) => f.id === fr)!.name}, líneas ${lines.join(", ")}.`)}
                    target="_blank"
                  >
                    Pedir esta propuesta
                  </PillButton>
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              { n: fmt(potencial), l: `Exposiciones diarias potenciales con las ${TOTAL_COCHES} unidades de las 5 líneas equipadas` },
              { n: "35.000", l: "Personas expuestas por día y por pantalla (escenario base)" },
              { n: "40 – 90″", l: "Lo que dura un semáforo porteño: el conductor de atrás mira de frente" },
            ].map((s) => (
              <div key={s.l} className="rounded-[1.6rem] p-7 shadow-[inset_0_0_0_1px_var(--hair)]">
                <p className="font-display text-[2.2rem] font-medium leading-none tracking-[-0.04em]">{s.n}</p>
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-dim">{s.l}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
