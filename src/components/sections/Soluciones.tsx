"use client";

import Image from "next/image";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Eyebrow, SplitHeading } from "@/components/ui";
import { SOLUTIONS } from "@/data/vixel";

gsap.registerPlugin(ScrollTrigger);

export default function Soluciones() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px)", () => {
        const el = track.current!;
        const dist = () => el.scrollWidth - window.innerWidth + 80;
        const tween = gsap.to(el, {
          x: () => -dist(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => "+=" + dist(),
            pin: true,
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });
        gsap.utils.toArray<HTMLElement>(".sol-img").forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -8 },
            {
              xPercent: 8,
              ease: "none",
              scrollTrigger: { trigger: img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="soluciones" className="relative overflow-hidden py-28 md:flex md:h-[100dvh] md:flex-col md:justify-center md:py-0">
      <div className="mx-auto w-full max-w-[1400px] px-5 md:px-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6">
            <Eyebrow>09 · Más allá del colectivo</Eyebrow>
            <SplitHeading
              text="Shoppings, fachadas, pisos y eventos."
              accent={["Shoppings,"]}
              className="max-w-3xl font-display text-[clamp(2.4rem,4.6vw,4.4rem)] font-medium leading-[0.95] tracking-[-0.045em]"
            />
          </div>
          <p className="max-w-sm text-[15.5px] leading-relaxed text-ink-dim">
            Fabricamos pantallas LED de todo tipo. Te asesoramos y diseñamos la solución a medida, del módulo LED a la
            instalación y el soporte.
          </p>
        </div>
      </div>

      <div
        ref={track}
        className="mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 md:mt-14 md:w-max md:snap-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible md:pl-10 md:pr-10"
      >
        {SOLUTIONS.map((s, i) => (
          <article key={s.title} className="bezel w-[82vw] shrink-0 snap-center sm:w-[420px] md:w-[440px]">
            <div className="bezel-core group">
              <div className="relative aspect-[4/3.4] overflow-hidden md:aspect-[4/2.9] [@media(min-height:900px)]:md:aspect-[4/3.4]">
                <div className="sol-img absolute -inset-x-[10%] inset-y-0">
                  <Image src={s.img} alt={s.title} fill sizes="460px" className="object-cover" />
                </div>
                <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] backdrop-blur-sm">
                  {s.tag}
                </span>
                <span className="absolute right-4 top-4 font-led text-xl font-black text-white/80">0{i + 1}</span>
              </div>
              <div className="p-6 pt-2">
                <h3 className="font-display text-[1.65rem] font-medium tracking-[-0.035em]">{s.title}</h3>
                <p className="mt-2 text-[14.5px] leading-relaxed text-ink-dim">{s.text}</p>
              </div>
            </div>
          </article>
        ))}
        <article className="flex w-[82vw] shrink-0 snap-center flex-col justify-end rounded-[2rem] bg-cyan p-8 text-bg sm:w-[420px] md:w-[440px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em]">A medida</p>
          <p className="mt-4 font-display text-[2.4rem] font-medium leading-[0.95] tracking-[-0.045em]">
            ¿Tenés un espacio? Lo convertimos en pantalla.
          </p>
          <a
            href="#contacto"
            className="mt-8 inline-flex w-max items-center gap-3 rounded-full bg-bg py-2 pl-5 pr-2 text-[14px] font-medium text-ink"
          >
            Pedir asesoramiento
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan text-bg">↗</span>
          </a>
        </article>
      </div>
    </section>
  );
}
