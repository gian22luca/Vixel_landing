"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export default function CityBreak({
  img,
  top,
  bottom,
  kicker,
}: {
  img: string;
  top: string;
  bottom: string;
  kicker: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.25, 1.05, 1.15]);
  const x1 = useTransform(scrollYProgress, [0, 1], ["8%", "-14%"]);
  const x2 = useTransform(scrollYProgress, [0, 1], ["-14%", "8%"]);
  const clip = useTransform(scrollYProgress, [0, 0.35], ["inset(12% 6% 12% 6% round 2.5rem)", "inset(0% 0% 0% 0% round 0rem)"]);

  return (
    <div ref={ref} className="relative h-[110vh] overflow-hidden">
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        <motion.div className="absolute inset-0" style={{ y, scale }}>
          <Image src={img} alt="" fill sizes="100vw" className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-[#232323]/70" />
      </motion.div>
      <div className="relative flex h-full flex-col items-center justify-center gap-4 overflow-hidden">
        <span className="eyebrow bg-black/40">{kicker}</span>
        <motion.p style={{ x: x1 }} className="whitespace-nowrap font-display text-[clamp(3.5rem,12vw,13rem)] font-medium leading-[0.9] tracking-[-0.06em]">
          {top}
        </motion.p>
        <motion.p
          style={{ x: x2 }}
          className="whitespace-nowrap font-display text-[clamp(3.5rem,12vw,13rem)] font-medium leading-[0.9] tracking-[-0.06em] text-transparent [-webkit-text-stroke:1.5px_rgba(238,243,255,0.85)]"
        >
          {bottom}
        </motion.p>
      </div>
    </div>
  );
}
