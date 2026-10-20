"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "motion/react";
import { PillButton } from "@/components/ui";
import { scrollToId } from "@/components/SmoothScroll";
import { waLink } from "@/data/vixel";

gsap.registerPlugin(ScrollTrigger);

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-bg" />,
});

const EASE = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const brand = useRef("");
  const [value, setValue] = useState("");

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (s) => (progress.current = s.progress),
      });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.6 },
      });
      tl.to(".hero-copy", { opacity: 0, y: -80, filter: "blur(12px)", ease: "power2.in", duration: 0.35 }, 0)
        .to(".hero-meta", { opacity: 0, y: 40, duration: 0.25 }, 0)
        .fromTo(".hero-end", { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out" }, 0.62)
        .to(".hero-end", { opacity: 0, duration: 0.12 }, 0.9);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="top" className="relative h-[290vh]">
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <div className="absolute inset-0">
          <HeroScene progress={progress} brand={brand} />
        </div>
        {/* velo sólido de lectura en mobile */}
        <div className="pointer-events-none absolute inset-0 bg-bg/55 md:hidden" />

        <div className="hero-copy relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-center px-5 pt-24 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EASE, delay: 2.1 }}
          >
            <span className="eyebrow">Digital Out of Home · CABA 2026</span>
          </motion.div>
          <h1 className="mt-7 font-display text-[clamp(3.2rem,9.4vw,9.5rem)] font-medium leading-[0.86] tracking-[-0.055em]">
            {["La ciudad", "es la pantalla."].map((l, i) => (
              <span key={l} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className={i === 1 ? "block text-gradient" : "block"}
                  initial={{ y: "105%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 1.3, ease: EASE, delay: 2.2 + i * 0.12 }}
                >
                  {l}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            className="mt-7 max-w-md text-[17px] leading-relaxed text-ink-dim text-pretty"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 2.5 }}
          >
            Pantallas LED de alto brillo en la luneta trasera de los colectivos de Buenos Aires. Tu marca recorre 250 km
            por día, a la altura de los ojos, justo donde la ciudad se detiene: el semáforo.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 2.65 }}
          >
            <PillButton href={waLink()} target="_blank">
              Quiero pautar
            </PillButton>
            <PillButton variant="ghost" onClick={() => scrollToId("red")}>
              Ver recorridos
            </PillButton>
          </motion.div>

          <motion.label
            className="mt-10 flex max-w-sm items-center gap-3 rounded-full bg-white/[0.03] py-1.5 pl-5 pr-1.5 shadow-[inset_0_0_0_1px_var(--hair-2)] focus-within:shadow-[inset_0_0_0_1px_rgba(46,230,245,0.55)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 3 }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">Probá</span>
            <input
              value={value}
              maxLength={14}
              onChange={(e) => {
                setValue(e.target.value);
                brand.current = e.target.value;
              }}
              placeholder="Escribí tu marca"
              className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-mute focus:outline-none"
              aria-label="Escribí el nombre de tu marca para verla en la pantalla del colectivo"
            />
            <span className="whitespace-nowrap rounded-full bg-white/10 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-dim">
              en vivo ↗
            </span>
          </motion.label>
        </div>

        <div className="hero-meta absolute inset-x-0 bottom-0 z-10">
          <div className="mx-auto flex max-w-[1400px] flex-row-reverse items-end justify-between gap-6 px-5 pb-8 md:px-10">
            <div className="hidden gap-10 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-dim xl:flex">
              <span>
                <b className="block font-display text-2xl font-medium normal-case tracking-tight text-ink">5.500 nits</b>
                Legible a pleno sol
              </span>
              <span>
                <b className="block font-display text-2xl font-medium normal-case tracking-tight text-ink">1,02 m²</b>
                33% más grande
              </span>
              <span>
                <b className="block font-display text-2xl font-medium normal-case tracking-tight text-ink">4G + GPS</b>
                Gestión en tiempo real
              </span>
            </div>
            <div className="hidden items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-ink-mute">
              <span className="relative block h-10 w-[1px] overflow-hidden bg-white/10">
                <span className="absolute inset-x-0 top-0 h-1/2 animate-[scan_1.8s_cubic-bezier(0.65,0,0.35,1)_infinite] bg-cyan" />
              </span>
              Scroll
            </div>
          </div>
        </div>

        <div className="hero-end pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0">
          <p className="px-6 text-center font-display text-[clamp(2.2rem,6vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.045em] [text-shadow:0_6px_60px_rgba(0,0,0,0.9)]">
            Imposible de bloquear.
            <br />
            <span className="text-gradient">Imposible de saltear.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
