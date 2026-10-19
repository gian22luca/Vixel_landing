"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Counter, Reveal, Eyebrow } from "@/components/ui";
import { MARKET } from "@/data/vixel";

gsap.registerPlugin(ScrollTrigger);

const TICKER = ["Línea 12", "Línea 39", "Línea 67", "Línea 102", "Línea 124", "329 coches", "5.500 nits", "4G + GPS", "Loop de 90″", "18 h al aire", "Geofencing", "CABA"];

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      // texto que se "enciende" palabra por palabra con el scroll
      gsap.fromTo(
        ".mf-word",
        { opacity: 0.12 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: { trigger: ".mf-text", start: "top 78%", end: "bottom 45%", scrub: true },
        },
      );
    },
    { scope: root },
  );

  const sentence =
    "La cartelería fija alcanza sólo a quien pasa por un punto. El vinilo es estático. El digital online se bloquea y se saltea. Vixel es un cartel digital que recorre 250 km por día, a la altura de los ojos de conductores y peatones.";

  return (
    <section ref={root} className="relative pt-10 pb-28 md:pb-40">
      {/* ticker LED */}
      <div className="relative overflow-hidden border-y border-hair bg-[#1b1b1b] py-5">
        <div className="marquee flex w-max gap-12 whitespace-nowrap">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-12 font-led text-[28px] font-black uppercase tracking-wide text-cyan/90 md:text-[34px]">
              {t}
              <span className="h-2 w-2 rounded-[2px] bg-blue shadow-[0_0_12px_var(--blue)]" />
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10 md:pt-40">
        <Reveal>
          <Eyebrow>01 · Contexto</Eyebrow>
        </Reveal>
        <p className="mf-text mt-10 max-w-[1150px] font-display text-[clamp(1.9rem,4.2vw,4rem)] font-medium leading-[1.06] tracking-[-0.035em]">
          {sentence.split(" ").map((w, i) => (
            <span key={i} className={`mf-word ${["Vixel", "250", "km", "ojos"].some((k) => w.startsWith(k)) ? "text-gradient" : ""}`}>
              {w}{" "}
            </span>
          ))}
        </p>

        <div className="mt-24 grid grid-cols-1 gap-px overflow-hidden rounded-[2rem] bg-hair shadow-[inset_0_0_0_1px_var(--hair)] sm:grid-cols-2 lg:grid-cols-4">
          {MARKET.map((m, i) => {
            const num = parseFloat(m.n.replace(",", ".").replace(/[^\d.]/g, ""));
            const dec = m.n.includes(",") ? 1 : 0;
            const suffix = m.n.replace(/[\d.,]/g, "");
            return (
              <Reveal key={m.n} delay={i * 0.08} className="bg-bg">
                <div className="flex h-full flex-col justify-between gap-12 p-8 md:p-10">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-mute">0{i + 1}</span>
                  <div>
                    <Counter
                      to={num}
                      decimals={dec}
                      suffix={suffix}
                      className="block font-display text-[clamp(3rem,5vw,4.6rem)] font-medium leading-none tracking-[-0.05em]"
                    />
                    <p className="mt-4 max-w-[26ch] text-[14.5px] leading-relaxed text-ink-dim">{m.l}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
        <p className="mt-5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-mute">
          Fuentes: relevamiento de mercado OOH/DOOH Argentina · Presentación comercial Vixel 2026
        </p>
      </div>
    </section>
  );
}
