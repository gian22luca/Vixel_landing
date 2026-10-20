"use client";

import Image from "next/image";
import { Reveal, SectionHead } from "@/components/ui";
import { FLEET_PRODUCTS } from "@/data/vixel";

export default function Flota() {
  return (
    <section id="flota" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          <SectionHead
            className="lg:col-span-6"
            eyebrow="10 · Para empresas de transporte"
            title="Fabricamos lo que instalamos."
            accent={["instalamos."]}
            text="Nacimos hace más de cinco años fabricando carteles LED para colectivos: empezamos por la Línea 102 y hoy damos servicio en seis líneas. Reparamos arriba del colectivo, sin bajarlo de servicio."
          />
          <Reveal delay={0.1} className="lg:col-span-6">
            <div className="bezel">
              <div className="bezel-core relative aspect-[16/10]">
                <Image src="/img/bus-102-front.jpg" alt="Colectivo Línea 102 con cartel frontal y ramalera Vixel" fill sizes="50vw" className="object-cover object-top" />
                <div className="absolute inset-0 bg-black/45" />
                <p className="absolute bottom-5 left-5 font-mono text-[10.5px] uppercase tracking-[0.18em]">
                  Instalación real · Línea 102 · Buenos Aires
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FLEET_PRODUCTS.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.08}>
              <article className="bezel h-full">
                <div className="bezel-core group flex h-full flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden bg-black">
                    <Image
                      src={p.img}
                      alt={p.title}
                      fill
                      sizes="(min-width:1024px) 25vw, 50vw"
                      style={"pos" in p ? { objectPosition: p.pos } : undefined}
                      className="object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <span className="font-led text-lg font-black text-cyan">{p.n}</span>
                    <h3 className="mt-2 font-display text-xl font-medium tracking-[-0.03em]">{p.title}</h3>
                    <p className="mt-2 flex-1 text-[14px] leading-relaxed text-ink-dim">{p.text}</p>
                    <p className="mt-5 border-t border-hair pt-4 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-mute">{p.spec}</p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {["/img/led-68.jpg", "/img/led-12.jpg"].map((s) => (
              <div key={s} className="relative aspect-[44/10] overflow-hidden rounded-2xl bg-black shadow-[inset_0_0_0_1px_var(--hair)]">
                <Image src={s} alt="Cartel LED tradicional reparado por Vixel" fill sizes="50vw" className="object-contain" />
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
