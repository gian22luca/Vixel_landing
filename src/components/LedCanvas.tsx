"use client";

import { useEffect, useRef } from "react";
import { AD_H, AD_W, paintLoop } from "@/lib/adPainter";

/** Pantalla LED 2D: renderiza el loop publicitario como matriz de diodos. */
export default function LedCanvas({
  cols = 160,
  period = 3,
  brand,
  force,
  onSlide,
  className,
}: {
  cols?: number;
  period?: number;
  brand?: string;
  force?: number;
  onSlide?: (i: number) => void;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const brandRef = useRef(brand);
  const forceRef = useRef(force);
  const onSlideRef = useRef(onSlide);
  useEffect(() => {
    brandRef.current = brand;
    forceRef.current = force;
    onSlideRef.current = onSlide;
  });

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const src = document.createElement("canvas");
    src.width = AD_W;
    src.height = AD_H;
    const sctx = src.getContext("2d", { willReadFrequently: true })!;
    const rows = Math.round((cols * AD_H) / AD_W);
    const small = document.createElement("canvas");
    small.width = cols;
    small.height = rows;
    const smctx = small.getContext("2d", { willReadFrequently: true })!;

    let raf = 0;
    let visible = true;
    let last = -1;
    const start = performance.now();
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = cv.clientWidth * dpr;
      cv.height = cv.clientHeight * dpr;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const t = (now - start) / 1000;
      const idx = paintLoop(sctx, t, period, brandRef.current || undefined, forceRef.current);
      if (idx !== last) {
        last = idx;
        onSlideRef.current?.(idx);
      }
      smctx.drawImage(src, 0, 0, cols, rows);
      const data = smctx.getImageData(0, 0, cols, rows).data;
      const W = cv.width;
      const H = cv.height;
      const pitch = Math.min(W / cols, H / rows);
      const ox = (W - pitch * cols) / 2;
      const oy = (H - pitch * rows) / 2;
      const r = pitch * 0.36;
      ctx.fillStyle = "#161616";
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 4;
          const R = data[i];
          const G = data[i + 1];
          const B = data[i + 2];
          ctx.fillStyle = R + G + B < 20 ? "#262626" : `rgb(${R},${G},${B})`;
          ctx.beginPath();
          ctx.arc(ox + x * pitch + pitch / 2, oy + y * pitch + pitch / 2, r, 0, 6.2832);
          ctx.fill();
        }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
    };
  }, [cols, period]);

  return <canvas ref={ref} className={className} style={{ filter: "drop-shadow(0 0 18px rgba(46,230,245,0.18))" }} />;
}
