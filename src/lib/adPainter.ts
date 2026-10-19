// Pinta los "spots" del loop publicitario en un canvas de 400×160 (resolución real de la luneta Vixel).

export const AD_W = 400;
export const AD_H = 160;

export type Slide = {
  name: string;
  draw: (ctx: CanvasRenderingContext2D, p: number, t: number, brand?: string) => void;
};

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function bg(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, AD_W, AD_H);
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  size: number,
  color: string,
  weight = 800,
  align: CanvasTextAlign = "left",
) {
  ctx.font = `${weight} ${size}px "Space Grotesk", system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(s, x, y);
}

export const SLIDES: Slide[] = [
  {
    name: "Tu marca",
    draw(ctx, p, t, brand = "TU MARCA") {
      bg(ctx, "#1b22ff");
      // barrido de luz (banda sólida)
      const sx = ((t * 160) % (AD_W + 200)) - 100;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(sx - 30, 0, 60, AD_H);
      const e = ease(p * 4);
      const label = brand.toUpperCase().slice(0, 14);
      const size = label.length > 9 ? 46 : 62;
      text(ctx, label, AD_W / 2, 68 + (1 - e) * 60, size, "#ffffff", 800, "center");
      ctx.globalAlpha = ease(p * 4 - 0.6);
      text(ctx, "ACÁ · 250 KM POR DÍA", AD_W / 2, 122, 20, "#e8fdff", 600, "center");
      ctx.globalAlpha = 1;
    },
  },
  {
    name: "Gastronomía",
    draw(ctx, p) {
      bg(ctx, "#ff5a1a");
      const e = ease(p * 3);
      ctx.fillStyle = "#1a0700";
      ctx.beginPath();
      ctx.arc(320, 80, 52 * e, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, "2x1", 320, 82, 44 * e + 1, "#ffcc00", 900, "center");
      text(ctx, "HAPPY", 30 - (1 - e) * 200, 56, 46, "#1a0700");
      text(ctx, "HOUR", 30 - (1 - ease(p * 3 - 0.2)) * 200, 104, 46, "#ffffff");
      text(ctx, "18 a 21 h · a 300 m", 32, 142, 16, "#1a0700", 600);
    },
  },
  {
    name: "Banco",
    draw(ctx, p) {
      bg(ctx, "#0a2a6e");
      const e = ease(p * 3);
      text(ctx, "12", 40, 82, 96 * e + 1, "#3cffc8", 900);
      text(ctx, "CUOTAS", 170, 62, 34, "#ffffff", 800);
      text(ctx, "SIN INTERÉS", 170, 100, 26, "#9fd8ff", 600);
      ctx.fillStyle = "#3cffc8";
      ctx.fillRect(170, 124, 190 * ease(p * 2 - 0.3), 4);
    },
  },
  {
    name: "Shopping",
    draw(ctx, p, t) {
      bg(ctx, "#c2126f");
      for (let i = 0; i < 18; i++) {
        const x = (i * 53 + t * 40) % AD_W;
        const y = (i * 37) % AD_H;
        ctx.fillStyle = `rgba(255,255,255,${0.08 + (i % 3) * 0.05})`;
        ctx.fillRect(x, y, 6, 6);
      }
      const e = ease(p * 3);
      text(ctx, "SALE", 200, 70, 78 * (0.6 + 0.4 * e), "#ffffff", 900, "center");
      text(ctx, "HASTA 50% OFF · ESTE FINDE", 200, 128, 19, "#ffd6ef", 600, "center");
    },
  },
  {
    name: "Inmobiliaria",
    draw(ctx, p) {
      bg(ctx, "#1a1a1a");
      const e = ease(p * 3);
      ctx.strokeStyle = "#f5c46b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(40, 120);
      ctx.lineTo(40, 70);
      ctx.lineTo(80, 40);
      ctx.lineTo(120, 70);
      ctx.lineTo(120, 120);
      ctx.stroke();
      ctx.globalAlpha = e;
      text(ctx, "TU DEPTO EN", 150, 62, 28, "#ffffff", 700);
      text(ctx, "PALERMO", 150, 100, 40, "#f5c46b", 900);
      ctx.globalAlpha = 1;
      text(ctx, "Desde USD 1.900 / m²", 150, 136, 15, "#bdbdbd", 500);
    },
  },
  {
    name: "Vixel",
    draw(ctx, p, t) {
      ctx.fillStyle = "#02030a";
      ctx.fillRect(0, 0, AD_W, AD_H);
      // V pixelada
      const cols = 11;
      const s = 9;
      const ox = 40;
      const oy = 30;
      for (let r = 0; r < 11; r++)
        for (let c = 0; c < cols; c++) {
          const inV = Math.abs(c - 5) <= 5 - r / 2.2 && Math.abs(c - 5) >= 5 - r / 2.2 - 2.4;
          if (!inV) continue;
          const on = ease(p * 4 - (r + c) * 0.03);
          ctx.fillStyle = `rgba(46,230,245,${on * (0.85 + Math.sin(t * 3 + r + c) * 0.15)})`;
          ctx.fillRect(ox + c * s, oy + r * s, s - 2, s - 2);
        }
      text(ctx, "VIXEL", 170, 66, 50, "#ffffff", 700);
      text(ctx, "LA CIUDAD ES LA PANTALLA", 172, 108, 15, "#2ee6f5", 600);
    },
  },
];

/** Dibuja el loop: devuelve el índice actual. `period` = segundos por spot. */
export function paintLoop(ctx: CanvasRenderingContext2D, time: number, period = 3, brand?: string, force?: number) {
  // el timestamp del primer frame de rAF puede ser anterior al inicio
  const t = Math.max(0, time);
  const idx = force ?? Math.floor(t / period) % SLIDES.length;
  const p = (t % period) / period;
  ctx.save();
  SLIDES[idx].draw(ctx, p, t, brand);
  ctx.restore();
  // transición tipo "wipe" de píxeles al final
  if (force === undefined && p > 0.92) {
    const k = (p - 0.92) / 0.08;
    ctx.fillStyle = "#000";
    for (let x = 0; x < AD_W; x += 10)
      for (let y = 0; y < AD_H; y += 10) if (((x * 7 + y * 13) % 100) / 100 < k) ctx.fillRect(x, y, 10, 10);
  }
  return idx;
}
