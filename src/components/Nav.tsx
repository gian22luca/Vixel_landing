"use client";

import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import clsx from "clsx";
import { scrollToId } from "./SmoothScroll";
import { waLink } from "@/data/vixel";
import { Arrow } from "./ui";

const LINKS = [
  { id: "formato", label: "El formato" },
  { id: "red", label: "Recorridos" },
  { id: "audiencia", label: "Audiencia" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "soluciones", label: "Shoppings" },
  { id: "planes", label: "Planes" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(v > prev && v > 400 && !open);
  });

  const go = (id: string) => {
    setOpen(false);
    setTimeout(() => scrollToId(id), open ? 350 : 0);
  };

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-[70] flex justify-center px-3 pt-4 md:pt-6"
        initial={{ y: -120 }}
        animate={{ y: hidden ? -120 : 0 }}
        transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1], delay: hidden ? 0 : 0 }}
      >
        <nav className="flex w-full max-w-[1100px] items-center justify-between gap-4 rounded-full bg-[rgba(35,35,35,0.72)] py-2 pl-4 pr-2 shadow-[inset_0_0_0_1px_var(--hair-2),0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-2xl md:w-max md:justify-start">
          <button onClick={() => go("top")} className="flex items-center gap-2.5" aria-label="Vixel, inicio">
            <Image src="/img/vixel-v.png" alt="" width={30} height={26} className="h-[26px] w-auto" priority />
            <span className="font-display text-[19px] font-semibold tracking-[-0.03em]">Vixel</span>
          </button>
          <ul className="ml-6 hidden items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => go(l.id)}
                  className="rounded-full px-3.5 py-2 text-[13.5px] text-ink-dim transition-colors duration-300 hover:bg-white/[0.06] hover:text-ink"
                >
                  {l.label}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="group hidden items-center gap-2 rounded-full bg-ink py-1.5 pl-4 pr-1.5 text-[13.5px] font-medium text-bg transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] sm:flex lg:ml-3"
            >
              Pautar
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bg text-cyan transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <Arrow className="h-3 w-3" />
              </span>
            </a>
            <button
              onClick={() => setOpen((o) => !o)}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] lg:hidden"
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              <span
                className={clsx(
                  "absolute h-px w-4 bg-ink transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  open ? "rotate-45" : "-translate-y-[4px]",
                )}
              />
              <span
                className={clsx(
                  "absolute h-px w-4 bg-ink transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  open ? "-rotate-45" : "translate-y-[4px]",
                )}
              />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[65] flex flex-col justify-end bg-[rgba(35,35,35,0.92)] px-6 pb-14 backdrop-blur-3xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <li key={l.id} className="overflow-hidden">
                  <motion.button
                    onClick={() => go(l.id)}
                    className="flex w-full items-baseline gap-4 py-2 text-left font-display text-[2.6rem] font-medium tracking-[-0.04em]"
                    initial={{ y: 60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 30, opacity: 0 }}
                    transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1], delay: 0.08 + i * 0.05 }}
                  >
                    <span className="font-mono text-xs text-cyan">0{i + 1}</span>
                    {l.label}
                  </motion.button>
                </li>
              ))}
            </ul>
            <motion.a
              href={waLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex w-max items-center gap-3 rounded-full bg-ink py-2 pl-6 pr-2 font-medium text-bg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6 }}
            >
              Hablemos por WhatsApp
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bg text-cyan">
                <Arrow />
              </span>
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
