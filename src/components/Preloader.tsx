"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// V pixelada (12×10) que se "enciende" como una matriz LED.
const GRID = [
  "11........11",
  "111......111",
  ".11......11.",
  ".111....111.",
  "..11....11..",
  "..111..111..",
  "...11..11...",
  "...111111...",
  "....1111....",
  ".....11.....",
];

export default function Preloader() {
  const [done, setDone] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    const start = performance.now();
    let raf = 0;
    const loop = (t: number) => {
      const p = Math.min(1, (t - start) / 1700);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(loop);
      else
        setTimeout(() => {
          setDone(true);
          document.documentElement.style.overflow = "";
        }, 220);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-bg"
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="grid gap-[5px]" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
            {GRID.flatMap((row, r) =>
              row.split("").map((c, i) => {
                const on = c === "1";
                const order = r * 12 + i;
                const lit = on && n > (order / 120) * 90;
                return (
                  <span
                    key={`${r}-${i}`}
                    className="h-3 w-3 rounded-[2px] transition-all duration-300 md:h-4 md:w-4"
                    style={{
                      background: lit ? "var(--cyan)" : "rgba(255,255,255,0.06)",
                      boxShadow: lit ? "0 0 14px rgba(46,230,245,0.7)" : "none",
                    }}
                  />
                );
              }),
            )}
          </div>
          <div className="mt-10 flex w-56 items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim">
            <span>Vixel · LED</span>
            <span className="font-led text-lg tracking-normal text-cyan">{String(n).padStart(3, "0")}</span>
          </div>
          <div className="mt-3 h-px w-56 overflow-hidden bg-white/10">
            <div className="h-full bg-cyan" style={{ width: `${n}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
