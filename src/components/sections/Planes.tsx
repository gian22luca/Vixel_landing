"use client";

import clsx from "clsx";
import { Reveal, SectionHead, Arrow } from "@/components/ui";
import { COMPARE, PACKAGES, SHOW_PRICES, fmt, money, waLink } from "@/data/vixel";

export default function Planes() {
  return (
    <section id="planes" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <SectionHead
          align="center"
          eyebrow="08 · Planes"
          title="Cuatro puertas de entrada."
          accent={["entrada."]}
          text="Todas al mismo precio unitario: lo que crece con el volumen son los beneficios, no el descuento. CPM constante de $1.714."
        />

        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PACKAGES.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.08}>
              <article className={clsx("bezel h-full", p.featured && "bg-cyan/40")}>
                <div className="bezel-core relative flex h-full flex-col p-7">
                  {p.featured && (
                    <span className="absolute right-5 top-5 rounded-full bg-cyan px-3 py-1 font-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-bg">
                      Recomendado
                    </span>
                  )}
                  <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-dim">{p.name}</p>
                  <p className="mt-6 flex items-baseline gap-2">
                    <span className="font-led text-7xl font-black leading-none">{p.screens}</span>
                    <span className="text-ink-dim">pantallas</span>
                  </p>
                  {SHOW_PRICES && (
                    <p className="mt-6 font-display text-[1.9rem] font-medium tracking-[-0.04em]">
                      {money(p.price)}
                      <span className="ml-1 text-[13px] font-normal tracking-normal text-ink-mute">/mes + IVA</span>
                    </p>
                  )}
                  <div className="mt-6 space-y-1 border-y border-hair py-4 text-[13.5px]">
                    <p className="flex justify-between">
                      <span className="text-ink-dim">Impactos/mes</span>
                      <span>{fmt(p.impacts)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-ink-dim">Apariciones/mes</span>
                      <span>{fmt(p.apar)}</span>
                    </p>
                  </div>
                  <ul className="mt-5 flex-1 space-y-2.5 text-[14px] text-ink-dim">
                    {p.perks.map((x) => (
                      <li key={x} className="flex gap-3">
                        <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-[1px] bg-cyan" />
                        {x}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={waLink(`Hola Vixel, me interesa el plan ${p.name} (${p.screens} pantallas).`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      "group mt-8 flex items-center justify-between rounded-full py-2 pl-5 pr-2 text-[14px] font-medium transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]",
                      p.featured ? "bg-ink text-bg" : "bg-white/[0.05] shadow-[inset_0_0_0_1px_var(--hair-2)]",
                    )}
                  >
                    Elegir {p.name}
                    <span
                      className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px",
                        p.featured ? "bg-bg text-cyan" : "bg-white/10",
                      )}
                    >
                      <Arrow />
                    </span>
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
        <p className="mt-6 text-center font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-mute">
          Compra mínima 5 pantallas · Descuento por permanencia 5% (3m) · 10% (6m) · 15% (12m) · Producción bonificada desde 10
          pantallas
        </p>

        {/* comparativa */}
        <Reveal className="mt-24">
          <div className="bezel">
            <div className="bezel-core overflow-x-auto p-2 md:p-4">
              <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-[14px]">
                <thead>
                  <tr>
                    <th className="p-4 font-mono text-[10.5px] font-normal uppercase tracking-[0.16em] text-ink-mute">Atributo</th>
                    {COMPARE.cols.map((c, i) => (
                      <th
                        key={c}
                        className={clsx(
                          "p-4 font-display text-[15px] font-medium tracking-[-0.02em]",
                          i === 0 ? "rounded-t-2xl bg-cyan/15 text-ink" : "text-ink-dim",
                        )}
                      >
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.rows.map((r, ri) => (
                    <tr key={r.a}>
                      <td className="border-t border-hair p-4 text-ink-dim">{r.a}</td>
                      {r.v.map((v, i) => (
                        <td
                          key={i}
                          className={clsx(
                            "border-t border-hair p-4",
                            i === 0 ? "bg-cyan/[0.06] font-medium text-ink" : "text-ink-dim",
                            i === 0 && ri === COMPARE.rows.length - 1 && "rounded-b-2xl",
                          )}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
