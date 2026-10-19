"use client";

import { motion, useInView, useMotionValue, animate } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children,
  delay = 0,
  className,
  y = 48,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 1.1, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Headline that reveals word by word from a mask. */
export function SplitHeading({
  text,
  className,
  as: Tag = "h2",
  delay = 0,
  accent,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  delay?: number;
  accent?: string[];
}) {
  const words = text.split(" ");
  return (
    <Tag className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom" aria-hidden>
          <motion.span
            className={clsx("inline-block", accent?.includes(w.replace(/[.,]/g, "")) && "text-gradient")}
            initial={{ y: "110%", rotate: 4 }}
            whileInView={{ y: "0%", rotate: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 1, ease: EASE, delay: delay + i * 0.06 }}
          >
            {w}
            {i < words.length - 1 && " "}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function Counter({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 2.2,
  className,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const mv = useMotionValue(0);
  const [val, setVal] = useState("0");
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration, ease: [0.16, 1, 0.3, 1] });
    const un = mv.on("change", (v) =>
      setVal(v.toLocaleString("es-AR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })),
    );
    return () => {
      c.stop();
      un();
    };
  }, [inView, to, decimals, duration, mv]);
  return (
    <span ref={ref} className={className}>
      {prefix}
      {val}
      {suffix}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx("eyebrow", className)}>{children}</span>;
}

export function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={clsx("h-3.5 w-3.5", className)} fill="none" stroke="currentColor" strokeWidth="1.3">
      <path d="M4.5 11.5l7-7M5.5 4.5h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PillButton({
  href,
  children,
  variant = "solid",
  onClick,
  target,
}: {
  href?: string;
  children: ReactNode;
  variant?: "solid" | "ghost";
  onClick?: () => void;
  target?: string;
}) {
  const cls = clsx(
    "group relative inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-[15px] font-medium tracking-tight",
    "transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]",
    variant === "solid"
      ? "bg-ink text-bg hover:bg-white"
      : "text-ink shadow-[inset_0_0_0_1px_var(--hair-2)] hover:shadow-[inset_0_0_0_1px_rgba(46,230,245,0.5)] bg-white/[0.02]",
  );
  const inner = (
    <>
      <span>{children}</span>
      <span
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px group-hover:scale-105",
          variant === "solid" ? "bg-bg text-cyan" : "bg-white/10 text-ink",
        )}
      >
        <Arrow />
      </span>
    </>
  );
  if (href)
    return (
      <a href={href} target={target} rel={target ? "noopener noreferrer" : undefined} className={cls} onClick={onClick}>
        {inner}
      </a>
    );
  return (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}

export function SectionHead({
  eyebrow,
  title,
  accent,
  text,
  className,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  accent?: string[];
  text?: string;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={clsx("flex flex-col gap-6", align === "center" && "items-center text-center", className)}>
      <Reveal>
        <Eyebrow>{eyebrow}</Eyebrow>
      </Reveal>
      <SplitHeading
        text={title}
        accent={accent}
        className="font-display text-[clamp(2.4rem,6vw,5.6rem)] font-medium leading-[0.95] tracking-[-0.045em] text-balance"
      />
      {text && (
        <Reveal delay={0.15}>
          <p className={clsx("max-w-xl text-[17px] leading-relaxed text-ink-dim text-pretty", align === "center" && "mx-auto")}>
            {text}
          </p>
        </Reveal>
      )}
    </div>
  );
}
